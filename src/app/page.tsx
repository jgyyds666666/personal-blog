import type { Metadata } from 'next';
import { getPublishedPosts, type PostWithUrl } from '@/lib/posts-service';
import { PostBrowser } from '@/components/post-browser';
export const metadata: Metadata = { title: '首页', description: '记录技术、读书与生活的点滴思考' };
export const revalidate = 60;
export default async function HomePage() { let posts: PostWithUrl[] = []; let hasError = false; try { posts = await getPublishedPosts(); } catch (error) { hasError = true; console.error('获取文章失败:', error); } return <div className="mx-auto max-w-4xl px-6 py-12"><section className="py-12 text-center md:py-20"><p className="mb-3 text-sm font-medium tracking-[0.25em] text-[#b45309]">PERSONAL NOTES</p><h1 className="mb-4 text-4xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-5xl">墨香</h1><p className="mx-auto max-w-lg text-lg leading-relaxed text-[#6b7280]">记录代码、书本与生活<br />慢慢写，慢慢读，慢慢思考</p></section>{hasError ? <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-12 text-center text-sm text-red-700">文章加载失败，请稍后重试。</div> : <PostBrowser posts={posts} />}</div>; }
