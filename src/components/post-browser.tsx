'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { PostSummary } from '@/lib/posts-service';
import { PostCard } from '@/components/post-card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentCard } from '@/components/document-card';
import { DocumentUpload } from '@/components/document-upload';
import { AdminLogoutButton } from '@/components/admin-logout-button';
import type { PrivateDocumentSummary } from '@/lib/document-types';

interface PostBrowserProps {
  posts: PostSummary[];
  documents?: PrivateDocumentSummary[];
  authenticated?: boolean;
  documentError?: string | null;
}

type HomeItem = { kind: 'post'; value: PostSummary } | { kind: 'document'; value: PrivateDocumentSummary };

export function PostBrowser({ posts, documents = [], authenticated = false, documentError }: PostBrowserProps) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [scope, setScope] = useState('all');
  const tags = useMemo(() => Array.from(new Set(posts.flatMap((post) => post.tags))), [posts]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items: HomeItem[] = posts.map((value) => ({ kind: 'post', value }));
    if (authenticated) items.push(...documents.map((value): HomeItem => ({ kind: 'document', value })));
    return items.filter((item) => {
      if (authenticated && scope === 'documents' && item.kind !== 'document') return false;
      if (authenticated && scope === 'posts' && item.kind !== 'post') return false;
      const itemTags = item.kind === 'post' ? item.value.tags : [];
      const matchesTag = !activeTag || itemTags.includes(activeTag);
      const searchableText = [item.value.title, item.value.excerpt || '', ...itemTags, item.kind === 'document' ? item.value.original_name : ''].join(' ').toLowerCase();
      return matchesTag && (!normalizedQuery || searchableText.includes(normalizedQuery));
    }).sort((left, right) => right.value.created_at.localeCompare(left.value.created_at));
  }, [activeTag, posts, documents, authenticated, query, scope]);

  function clearFilters() {
    setQuery('');
    setActiveTag(null);
    setScope('all');
  }

  return (
    <>
      <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
        {authenticated ? <><DocumentUpload onUploaded={clearFilters} /><AdminLogoutButton nextPath="/" label="退出登录" /></> : <Link href="/login?next=/" className="ml-auto text-sm text-[#78716c] hover:text-[#b45309]">登录查看私人文档</Link>}
      </section>
      {authenticated && documentError && <p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{documentError}</p>}
      <section className="mb-8 space-y-4">
        {authenticated && <Tabs value={scope} onValueChange={(value) => { setScope(value); setActiveTag(null); }} className="items-center"><TabsList><TabsTrigger value="all">全部</TabsTrigger><TabsTrigger value="posts">公开文章</TabsTrigger><TabsTrigger value="documents">私人文档</TabsTrigger></TabsList></Tabs>}
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={authenticated ? '搜索文章或私人文档' : '搜索文章标题、摘要或标签'} className="h-11 rounded-full border-[#e7e2d8] bg-white/70 pl-10 pr-10" aria-label={authenticated ? '搜索文章或私人文档' : '搜索文章'} />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-label="清除搜索"><X className="size-4" /></button>}
        </div>
        {tags.length > 0 && (!authenticated || scope !== 'documents') && (
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setActiveTag(null)} className={`rounded-full px-3 py-1 text-sm ${!activeTag ? 'bg-[#b45309] text-white' : 'bg-[#f3efe7] text-[#78716c]'}`}>全部</button>
            {tags.map((tag) => <button type="button" key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`rounded-full px-3 py-1 text-sm ${activeTag === tag ? 'bg-[#b45309] text-white' : 'bg-[#f3efe7] text-[#78716c]'}`}>#{tag}</button>)}
          </div>
        )}
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-serif font-semibold text-[#2c2c2c]"><span className="h-5 w-1 rounded-full bg-[#b45309]" />{query || activeTag ? '筛选结果' : authenticated && scope === 'documents' ? '私人文档' : authenticated && scope === 'all' ? '最新内容' : '最新文章'}</h2>
          <span className="text-sm text-[#9ca3af]">{filteredItems.length} 篇</span>
        </div>
        {filteredItems.length ? (
          <div className="mt-4">{filteredItems.map((item) => item.kind === 'post' ? <PostCard key={`post-${item.value.id}`} post={item.value} /> : <DocumentCard key={`document-${item.value.id}`} document={item.value} />)}</div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d6d3cb] px-6 py-14 text-center text-sm text-[#78716c]">{authenticated && scope === 'documents' && !query ? '还没有私人文档，上传后会显示在这里。' : '没有找到匹配的内容'}<br /><button type="button" onClick={clearFilters} className="mt-3 text-[#b45309] hover:underline">清除筛选</button></div>
        )}
      </section>
    </>
  );
}
