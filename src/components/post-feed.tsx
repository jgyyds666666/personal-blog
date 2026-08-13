'use client';
import { useEffect, useState } from 'react';
import { posts as defaultPosts, type Post } from '@/data/posts';
import { mergePosts, readStoredPosts } from '@/lib/post-storage';
import { PostCard } from '@/components/post-card';
export function PostFeed() {
  const [allPosts, setAllPosts] = useState<Post[]>(defaultPosts);
  useEffect(() => { const sync = () => setAllPosts(mergePosts(defaultPosts, readStoredPosts())); sync(); window.addEventListener('posts-updated', sync); window.addEventListener('storage', sync); return () => { window.removeEventListener('posts-updated', sync); window.removeEventListener('storage', sync); }; }, []);
  const tags = Array.from(new Set(allPosts.flatMap((post) => post.tags)));
  return <>{tags.length > 0 && <section className="mb-8 flex flex-wrap justify-center gap-2"><span className="mr-2 self-center text-sm text-[#6b7280]">标签：</span>{tags.map((tag) => <span key={tag} className="rounded-full bg-[#f3efe7] px-3 py-1 text-sm text-[#78716c]">#{tag}</span>)}</section>}<section><h2 className="mb-2 flex items-center gap-2 text-lg font-serif font-semibold text-[#2c2c2c]"><span className="h-5 w-1 rounded-full bg-[#b45309]" />最新文章</h2><div className="mt-4">{allPosts.map((post) => <PostCard key={post.slug} post={post} />)}</div></section></>;
}
