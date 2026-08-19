'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/markdown-editor';
import { redirectIfAdminSessionExpired } from '@/lib/admin-client';
import { normalizeSlug } from '@/lib/post-validation';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

type PostStatus = 'draft' | 'published';

interface EditorData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tagsInput: string;
  status: PostStatus;
}

interface LocalEditDraft extends EditorData {
  savedAt: string;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [localSavedAt, setLocalSavedAt] = useState('');
  const [restored, setRestored] = useState(false);

  const editorData = useMemo<EditorData>(
    () => ({ title, slug, excerpt, content, tagsInput, status }),
    [content, excerpt, slug, status, tagsInput, title]
  );
  const currentSnapshot = useMemo(() => JSON.stringify(editorData), [editorData]);
  const hasChanges = Boolean(savedSnapshot) && currentSnapshot !== savedSnapshot;
  const storageKey = postId ? `personal-blog-edit-draft:${postId}` : '';

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      const { id } = await params;
      if (cancelled) return;
      setPostId(id);

      try {
        const response = await fetch(`/api/posts/${id}`);
        if (redirectIfAdminSessionExpired(response)) return;
        const result: {
          success?: boolean;
          data?: {
            title: string;
            slug: string;
            excerpt?: string;
            content?: string;
            tags?: string[];
            status: PostStatus;
          };
          error?: string;
        } = await response.json();
        if (!result.success || !result.data) throw new Error(result.error || '文章加载失败。');

        const serverData: EditorData = {
          title: result.data.title,
          slug: result.data.slug,
          excerpt: result.data.excerpt || '',
          content: result.data.content || '',
          tagsInput: (result.data.tags || []).join(', '),
          status: result.data.status,
        };
        setSavedSnapshot(JSON.stringify(serverData));

        const localDraft = readLocalDraft(`personal-blog-edit-draft:${id}`);
        const initialData = localDraft || serverData;
        setTitle(initialData.title);
        setSlug(initialData.slug);
        setExcerpt(initialData.excerpt);
        setContent(initialData.content);
        setTagsInput(initialData.tagsInput);
        setStatus(initialData.status);
        if (localDraft) {
          setRestored(true);
          setLocalSavedAt(localDraft.savedAt);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '文章加载失败，请稍后重试。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPost();
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    if (!storageKey || loading || !savedSnapshot) return;
    if (!hasChanges) {
      window.localStorage.removeItem(storageKey);
      setLocalSavedAt('');
      return;
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(storageKey, JSON.stringify({ ...editorData, savedAt } satisfies LocalEditDraft));
      setLocalSavedAt(savedAt);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [editorData, hasChanges, loading, savedSnapshot, storageKey]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  useEffect(() => {
    const saveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        document.getElementById('save-edit-draft')?.click();
      }
    };
    window.addEventListener('keydown', saveShortcut);
    return () => window.removeEventListener('keydown', saveShortcut);
  }, []);

  async function handleSave(nextStatus: PostStatus) {
    if (!title.trim()) return setMessage('请先填写文章标题。');
    if (!slug.trim()) return setMessage('请填写文章地址。');

    setSaving(true);
    setMessage('正在保存…');
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
          status: nextStatus,
        }),
      });
      if (redirectIfAdminSessionExpired(response)) return;
      const result: { success?: boolean; error?: string } = await response.json();
      if (!result.success) throw new Error(result.error || '保存失败。');

      const savedData: EditorData = {
        title: title.trim(),
        slug: normalizeSlug(slug),
        excerpt: excerpt.trim(),
        content: content.trim(),
        tagsInput,
        status: nextStatus,
      };
      setTitle(savedData.title);
      setSlug(savedData.slug);
      setExcerpt(savedData.excerpt);
      setContent(savedData.content);
      setStatus(nextStatus);
      setSavedSnapshot(JSON.stringify(savedData));
      if (storageKey) window.localStorage.removeItem(storageKey);
      setLocalSavedAt('');
      setRestored(false);
      setMessage(nextStatus === 'published' ? '文章已发布。' : '草稿已保存到服务器。');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  }

  function discardLocalDraft() {
    if (storageKey) window.localStorage.removeItem(storageKey);
    window.location.reload();
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-[#78716c]">正在加载文章…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#b45309]">内容管理 / 写作</p>
          <h1 className="mt-1 text-3xl font-serif font-bold text-[#2c2c2c]">编辑文章</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            当前状态：
            <span className={`ml-1 rounded-full px-2 py-1 text-xs ${status === 'published' ? 'bg-green-50 text-green-700' : 'bg-[#f3efe7] text-[#78716c]'}`}>
              {status === 'published' ? '已发布' : '草稿'}
            </span>
            {hasChanges && <span className="ml-2 text-[#b45309]">· 有未保存修改</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin" className="text-sm text-[#6b7280] hover:text-[#b45309]">返回列表</Link>
          <Link href={`/admin/preview/${postId}`} target="_blank" className="text-sm text-[#b45309] underline hover:text-[#92400e]">
            {hasChanges ? '预览已保存版本' : '预览文章'}
          </Link>
        </div>
      </div>

      {restored && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>已恢复上次未保存到服务器的修改。</span>
          <button type="button" onClick={discardLocalDraft} className="font-medium text-[#b45309] hover:underline">放弃本地修改</button>
        </div>
      )}
      {message && <div className="mb-4 rounded-lg border border-[#e7e2d8] bg-white px-4 py-3 text-sm text-[#57534e]">{message}</div>}

      <div className="space-y-5">
        <section className="rounded-xl border border-[#e7e2d8] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-[#2c2c2c]">文章信息</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#4b5563]">标题 <span className="text-red-500">*</span><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入文章标题" className="mt-1.5 h-11 text-lg" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#4b5563]">文章地址 <span className="text-red-500">*</span><Input value={slug} onChange={(event) => setSlug(event.target.value)} onBlur={() => setSlug(normalizeSlug(slug))} placeholder="例如：我的第一篇文章" className="mt-1.5" /><span className="mt-1 block text-xs font-normal text-[#9ca3af]">支持中文、英文、数字、短横线和下划线。</span></label>
              <label className="block text-sm font-medium text-[#4b5563]">标签<Input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="多个标签用逗号分隔" className="mt-1.5" /></label>
            </div>
            <label className="block text-sm font-medium text-[#4b5563]">摘要<textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="显示在文章列表中的简短介绍" rows={3} className="mt-1.5 w-full resize-none rounded-md border border-[#e7e2d8] px-3 py-2 text-sm outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20" /></label>
          </div>
        </section>
        <section className="rounded-xl border border-[#e7e2d8] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-lg font-semibold text-[#2c2c2c]">正文</h2><span className="text-xs text-[#9ca3af]">支持 Markdown</span></div>
          <MarkdownEditor value={content} onChange={setContent} placeholder="开始写作，支持 Markdown 格式。" />
        </section>
      </div>

      <div className="sticky bottom-3 z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7e2d8] bg-[#faf8f5]/95 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <span className="text-xs text-[#78716c]">{localSavedAt ? `本地备份于 ${formatTime(localSavedAt)}` : 'Ctrl/⌘ + S 保存草稿'}</span>
        <div className="flex gap-3">
          <Button id="save-edit-draft" onClick={() => void handleSave('draft')} disabled={saving} variant="outline">保存草稿</Button>
          <Button onClick={() => void handleSave('published')} disabled={saving} className="bg-[#b45309] text-white hover:bg-[#92400e]">{status === 'published' ? '更新发布' : '发布文章'}</Button>
        </div>
      </div>
    </div>
  );
}

function readLocalDraft(key: string): LocalEditDraft | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null') as Partial<LocalEditDraft> | null;
    if (!value || typeof value.title !== 'string' || typeof value.content !== 'string') return null;
    return {
      title: value.title,
      slug: value.slug || '',
      excerpt: value.excerpt || '',
      content: value.content,
      tagsInput: value.tagsInput || '',
      status: value.status === 'published' ? 'published' : 'draft',
      savedAt: value.savedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
