'use client';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { PostWithUrl } from '@/lib/posts-service';
import { PostCard } from '@/components/post-card';
import { Input } from '@/components/ui/input';

export function PostBrowser({ posts }: { posts: PostWithUrl[] }) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = useMemo(() => Array.from(new Set(posts.flatMap((post) => post.tags ?? []))), [posts]);
  const filteredPosts = useMemo(() => { const q = query.trim().toLowerCase(); return posts.filter((post) => (!activeTag || post.tags?.includes(activeTag)) && (!q || [post.title, post.excerpt ?? '', post.content].join(' ').toLowerCase().includes(q))); }, [activeTag, posts, query]);
  const clearFilters = () => { setQuery(''); setActiveTag(null); };
  return <><section className="mb-8 space-y-4"><div className="relative mx-auto max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章标题、摘要或正文" className="h-11 rounded-full border-[#e7e2d8] bg-white/70 pl-10 pr-10" aria-label="搜索文章" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-label="清除搜索"><X className="size-4" /></button>}</div>{tags.length > 0 && <div className="flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setActiveTag(null)} className={`rounded-full px-3 py-1 text-sm ${!activeTag ? 'bg-[#b45309] text-white' : 'bg-[#f3efe7] text-[#78716c]'}`}>全部</button>{tags.map((tag) => <button type="button" key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`rounded-full px-3 py-1 text-sm ${activeTag === tag ? 'bg-[#b45309] text-white' : 'bg-[#f3efe7] text-[#78716c]'}`}>#{tag}</button>)}</div>}</section><section><div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-serif font-semibold text-[#2c2c2c]"><span className="h-5 w-1 rounded-full bg-[#b45309]" />{query || activeTag ? '筛选结果' : '最新文章'}</h2><span className="text-sm text-[#9ca3af]">{filteredPosts.length} 篇</span></div>{filteredPosts.length ? <div className="mt-4">{filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}</div> : <div className="rounded-xl border border-dashed border-[#d6d3cb] px-6 py-14 text-center text-sm text-[#78716c]">没有找到匹配的文章<br /><button type="button" onClick={clearFilters} className="mt-3 text-[#b45309] hover:underline">清除筛选</button></div>}</section></>;
}
