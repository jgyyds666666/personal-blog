'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { posts as defaultPosts, type Post } from '@/data/posts';
import { mergePosts, readStoredPosts, writeStoredPosts } from '@/lib/post-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Draft = Omit<Post, 'tags'> & { tags: string };

const emptyDraft: Draft = {
  slug: '', title: '', excerpt: '', date: new Date().toISOString().slice(0, 10),
  tags: '', readingTime: '5 分钟', content: '',
};

function toDraft(post: Post): Draft { return { ...post, tags: post.tags.join(', ') }; }

export function PostManager() {
  const [allPosts, setAllPosts] = useState<Post[]>(defaultPosts);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setAllPosts(mergePosts(defaultPosts, readStoredPosts()));
  }, []);

  const isEditing = editingSlug !== null;
  const sortedPosts = useMemo(() => [...allPosts].sort((a, b) => b.date.localeCompare(a.date)), [allPosts]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditingSlug(null); setDraft(emptyDraft); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startEdit(post: Post) {
    setEditingSlug(post.slug); setDraft(toDraft(post)); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) { setNotice('请至少填写标题和正文。'); return; }
    const slug = (draft.slug.trim() || `post-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
    const post: Post = { slug: slug || `post-${Date.now()}`, title, excerpt: draft.excerpt.trim() || content.slice(0, 100), date: draft.date || new Date().toISOString().slice(0, 10), tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean), readingTime: draft.readingTime.trim() || '5 分钟', content };
    const next = allPosts.filter((item) => item.slug !== editingSlug && item.slug !== post.slug);
    next.push(post);
    setAllPosts(next); writeStoredPosts(next); setEditingSlug(post.slug); setDraft(toDraft(post)); setNotice('文章已保存到本机浏览器。');
  }

  function deletePost(post: Post) {
    if (!window.confirm(`确定删除《${post.title}》吗？`)) return;
    const next = allPosts.filter((item) => item.slug !== post.slug);
    setAllPosts(next); writeStoredPosts(next);
    if (editingSlug === post.slug) startNew();
    setNotice('文章已删除。');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-[#b45309] font-medium">内容管理</p><h1 className="mt-1 text-3xl font-serif font-bold text-[#2c2c2c]">我的文章</h1><p className="mt-2 text-sm text-[#6b7280]">在这里添加或修改文章，内容会保存在当前浏览器。</p></div>
        <Button onClick={startNew} className="bg-[#b45309] text-white hover:bg-[#92400e]"><Plus /> 新建文章</Button>
      </div>
      <form onSubmit={savePost} className="rounded-xl border border-[#e7e2d8] bg-white/70 p-5 md:p-7 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-[#2c2c2c]">{isEditing ? '编辑文章' : '新建文章'}</h2>{isEditing && <Button type="button" variant="ghost" size="sm" onClick={startNew}><X /> 取消编辑</Button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm text-[#4b5563]">标题<Input value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} placeholder="文章标题" /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563]">网址别名（可选）<Input value={draft.slug} onChange={(e) => updateDraft('slug', e.target.value)} placeholder="例如 react-19" /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563]">发布日期<Input type="date" value={draft.date} onChange={(e) => updateDraft('date', e.target.value)} /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563]">阅读时长<Input value={draft.readingTime} onChange={(e) => updateDraft('readingTime', e.target.value)} placeholder="5 分钟" /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563] md:col-span-2">标签（用逗号分隔）<Input value={draft.tags} onChange={(e) => updateDraft('tags', e.target.value)} placeholder="技术, React" /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563] md:col-span-2">摘要<Textarea value={draft.excerpt} onChange={(e) => updateDraft('excerpt', e.target.value)} placeholder="列表页显示的简短介绍" rows={2} /></label>
          <label className="space-y-1.5 text-sm text-[#4b5563] md:col-span-2">正文（支持 Markdown）<Textarea value={draft.content} onChange={(e) => updateDraft('content', e.target.value)} placeholder={'## 开始写作\n\n支持标题、列表、引用和代码块。'} rows={14} className="font-mono text-sm" /></label>
        </div>
        <div className="mt-5 flex items-center gap-3"><Button type="submit" className="bg-[#b45309] text-white hover:bg-[#92400e]"><Save /> 保存文章</Button>{notice && <span className="text-sm text-[#78716c]">{notice}</span>}</div>
      </form>
      <section className="mt-10"><h2 className="mb-3 font-serif text-xl font-semibold text-[#2c2c2c]">已发布文章（{sortedPosts.length}）</h2><div className="divide-y divide-[#e7e2d8] rounded-xl border border-[#e7e2d8] bg-white/50">{sortedPosts.map((post) => <div key={post.slug} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><h3 className="truncate font-medium text-[#2c2c2c]">{post.title}</h3><p className="mt-1 text-xs text-[#78716c]">{post.date} · /posts/{post.slug}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => startEdit(post)}><Pencil /> 编辑</Button><Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deletePost(post)}><Trash2 /> 删除</Button></div></div>)}</div></section>
    </div>
  );
}
