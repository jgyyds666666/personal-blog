'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/markdown-editor';
import { redirectIfAdminSessionExpired } from '@/lib/admin-client';
import { normalizeSlug } from '@/lib/post-validation';

const NEW_DRAFT_KEY = 'personal-blog-new-draft';

interface DraftData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tagsInput: string;
  savedAt?: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [restored, setRestored] = useState(false);
  const [localSavedAt, setLocalSavedAt] = useState('');
  const draft = useMemo<DraftData>(
    () => ({ title, slug, excerpt, content, tagsInput }),
    [content, excerpt, slug, tagsInput, title]
  );
  const hasContent = Boolean(title || content || excerpt || tagsInput);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NEW_DRAFT_KEY);
      if (!saved) return;
      const value = JSON.parse(saved) as Partial<DraftData>;
      setTitle(value.title || '');
      setSlug(value.slug || '');
      setExcerpt(value.excerpt || '');
      setContent(value.content || '');
      setTagsInput(value.tagsInput || '');
      setLocalSavedAt(value.savedAt || '');
      setRestored(true);
    } catch {
      window.localStorage.removeItem(NEW_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hasContent) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify({ ...draft, savedAt } satisfies DraftData));
      setLocalSavedAt(savedAt);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, hasContent]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasContent) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasContent]);

  useEffect(() => {
    const saveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        document.getElementById('save-new-draft')?.click();
      }
    };
    window.addEventListener('keydown', saveShortcut);
    return () => window.removeEventListener('keydown', saveShortcut);
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slug) {
      const generated = normalizeSlug(value);
      if (generated) setSlug(generated);
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(NEW_DRAFT_KEY);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setTagsInput('');
    setLocalSavedAt('');
    setRestored(false);
    setMessage('本地草稿已清空。');
  }

  async function handleSave(status: 'draft' | 'published') {
    if (!title.trim()) return setMessage('请先填写文章标题。');
    if (!slug.trim()) return setMessage('请填写文章地址（例如：我的第一篇文章）。');

    setSaving(true);
    setMessage('正在保存…');
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
          status,
        }),
      });
      if (redirectIfAdminSessionExpired(response)) return;
      const result: { success?: boolean; error?: string } = await response.json();
      if (!result.success) throw new Error(result.error || '保存失败。');
      window.localStorage.removeItem(NEW_DRAFT_KEY);
      router.push('/admin');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-[#b45309]">内容管理 / 写作</p><h1 className="mt-1 text-3xl font-serif font-bold text-[#2c2c2c]">新建文章</h1><p className="mt-2 text-sm text-[#6b7280]">写作内容会自动备份到当前浏览器。</p></div>
        <Link href="/admin" className="text-sm text-[#6b7280] hover:text-[#b45309]">返回文章列表</Link>
      </div>
      {restored && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e7e2d8] bg-[#f3efe7] px-4 py-3 text-sm text-[#57534e]"><span>已恢复上次未完成的草稿。</span><button type="button" onClick={clearDraft} className="text-[#b45309] hover:underline">清空草稿</button></div>}
      {message && <div className="mb-4 rounded-lg border border-[#e7e2d8] bg-white px-4 py-3 text-sm text-[#57534e]">{message}</div>}
      <div className="space-y-5">
        <section className="rounded-xl border border-[#e7e2d8] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-[#2c2c2c]">文章信息</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#4b5563]">标题 <span className="text-red-500">*</span><Input value={title} onChange={(event) => handleTitleChange(event.target.value)} placeholder="输入文章标题" className="mt-1.5 h-11 text-lg" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#4b5563]">文章地址 <span className="text-red-500">*</span><Input value={slug} onChange={(event) => setSlug(event.target.value)} onBlur={() => setSlug(normalizeSlug(slug))} placeholder="例如：我的第一篇文章" className="mt-1.5" /><span className="mt-1 block text-xs font-normal text-[#9ca3af]">支持中文、英文、数字、短横线和下划线。</span></label>
              <label className="block text-sm font-medium text-[#4b5563]">标签<Input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="多个标签用逗号分隔" className="mt-1.5" /><span className="mt-1 block text-xs font-normal text-[#9ca3af]">例如：前端, React, 随笔</span></label>
            </div>
            <label className="block text-sm font-medium text-[#4b5563]">摘要<textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="显示在文章列表中的简短介绍" rows={3} className="mt-1.5 w-full resize-none rounded-md border border-[#e7e2d8] px-3 py-2 text-sm outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20" /></label>
          </div>
        </section>
        <section className="rounded-xl border border-[#e7e2d8] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-lg font-semibold text-[#2c2c2c]">正文</h2><span className="text-xs text-[#9ca3af]">支持 Markdown</span></div>
          <MarkdownEditor value={content} onChange={setContent} placeholder="从这里开始写作…" />
        </section>
      </div>
      <div className="sticky bottom-3 z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7e2d8] bg-[#faf8f5]/95 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <span className="text-xs text-[#78716c]">{localSavedAt ? `本地备份于 ${formatTime(localSavedAt)}` : 'Ctrl/⌘ + S 保存草稿'}</span>
        <div className="flex gap-3"><Button id="save-new-draft" onClick={() => void handleSave('draft')} disabled={saving} variant="outline">保存草稿</Button><Button onClick={() => void handleSave('published')} disabled={saving} className="bg-[#b45309] text-white hover:bg-[#92400e]">发布文章</Button></div>
      </div>
    </div>
  );
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
