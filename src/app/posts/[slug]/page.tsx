import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedPosts, getPostBySlug } from '@/lib/posts-service';

interface PostPageProps { params: Promise<{ slug: string }> }
export const revalidate = 60;

export async function generateStaticParams() { try { const posts = await getPublishedPosts(); return posts.map((post) => ({ slug: post.slug })); } catch { return []; } }
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> { const { slug } = await params; try { const post = await getPostBySlug(slug); return post ? { title: post.title, description: post.excerpt || '' } : { title: '文章未找到' }; } catch { return { title: '文章' }; } }

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  let post;
  try { post = await getPostBySlug(slug); } catch { return <ErrorState />; }
  if (!post) notFound();
  return <article className="mx-auto max-w-2xl px-6 py-12"><Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm text-[#6b7280] transition-colors hover:text-[#b45309]">← 返回文章列表</Link><header className="mb-10"><div className="mb-4 flex items-center gap-3 text-sm text-[#6b7280]"><time dateTime={post.created_at}>{formatDate(post.created_at)}</time><span className="text-[#d6d3cb]">·</span><span>{calculateReadingTime(post.content)} 分钟阅读</span></div><h1 className="mb-4 text-3xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-4xl">{post.title}</h1><div className="flex flex-wrap gap-2">{(post.tags || []).map((tag) => <span key={tag} className="rounded-full bg-[#f3efe7] px-2.5 py-1 text-xs text-[#78716c]">#{tag}</span>)}</div></header><div className="post-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} /></article>;
}

function ErrorState() { return <div className="mx-auto max-w-2xl px-6 py-20 text-center"><p className="text-[#6b7280]">文章加载失败，请稍后重试。</p><Link href="/" className="mt-4 inline-block text-[#b45309] hover:text-[#92400e]">返回首页</Link></div>; }
function formatDate(value: string) { return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); }
function calculateReadingTime(content: string) { return Math.max(1, Math.ceil(content.replace(/\s/g, '').length / 400)); }
function renderMarkdown(text: string) { let html = text.trim().replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code: string) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`).replace(/`([^`]+)`/g, (_, code: string) => `<code>${escapeHtml(code)}</code>`).replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/^- (.*)$/gm, '<li>$1</li>'); html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>'); return html.split(/\n\s*\n/).map((part) => { const trimmed = part.trim(); if (!trimmed) return ''; if (/^<(h1|h2|h3|pre|ul|blockquote|img)/.test(trimmed)) return trimmed; return `<p>${trimmed.replace(/\n/g, ' ')}</p>`; }).join('\n'); }
function escapeHtml(text: string) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
