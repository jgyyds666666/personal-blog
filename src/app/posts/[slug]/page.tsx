'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { posts as defaultPosts, type Post } from '@/data/posts';
import { mergePosts, readStoredPosts } from '@/lib/post-storage';

export default function PostPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | undefined>(() => defaultPosts.find((item) => item.slug === params.slug));
  useEffect(() => { const sync = () => setPost(mergePosts(defaultPosts, readStoredPosts()).find((item) => item.slug === params.slug)); sync(); window.addEventListener('posts-updated', sync); window.addEventListener('storage', sync); return () => { window.removeEventListener('posts-updated', sync); window.removeEventListener('storage', sync); }; }, [params.slug]);
  if (!post) return <div className="mx-auto max-w-2xl px-6 py-20 text-center"><h1 className="font-serif text-2xl font-bold">文章未找到</h1><Link href="/" className="mt-4 inline-block text-[#b45309]">返回首页</Link></div>;
  return <article className="mx-auto max-w-2xl px-6 py-12"><Link href="/" className="mb-8 inline-flex text-sm text-[#6b7280] hover:text-[#b45309]">← 返回文章列表</Link><header className="mb-10"><div className="mb-4 flex items-center gap-3 text-sm text-[#6b7280]"><time dateTime={post.date}>{formatDate(post.date)}</time><span>·</span><span>{post.readingTime}</span></div><h1 className="mb-4 text-3xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-4xl">{post.title}</h1><div className="flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f3efe7] px-2.5 py-1 text-xs text-[#78716c]">#{tag}</span>)}</div></header><div className="post-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} /></article>;
}
function formatDate(value: string) { return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); }
function renderMarkdown(text: string) { let html = text.trim().replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code: string) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`).replace(/`([^`]+)`/g, (_, code: string) => `<code>${escapeHtml(code)}</code>`).replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^- (.*)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  return html.split(/\n\s*\n/).map((part) => { const trimmed = part.trim(); if (!trimmed) return ''; if (/^<(h2|h3|pre|ul|blockquote)/.test(trimmed)) return trimmed; return `<p>${trimmed.replace(/\n/g, ' ')}</p>`; }).join('\n'); }
function escapeHtml(text: string) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
