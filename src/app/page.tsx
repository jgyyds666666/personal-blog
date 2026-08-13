import type { Metadata } from 'next';
import { PostFeed } from '@/components/post-feed';
export const metadata: Metadata = { title: '首页', description: '记录技术、读书与生活的点滴思考' };
export default function HomePage() { return <div className="mx-auto max-w-4xl px-6 py-12"><section className="py-12 text-center md:py-20"><h1 className="mb-4 text-4xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-5xl">墨香</h1><p className="mx-auto max-w-lg text-lg leading-relaxed text-[#6b7280]">在这里，记录代码、书本与生活<br />慢慢写，慢慢读，慢慢思考</p></section><PostFeed /></div>; }
