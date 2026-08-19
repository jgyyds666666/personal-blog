import type { Metadata } from 'next';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: '关于',
  description: `关于${SITE_NAME}和作者的介绍。`,
  alternates: { canonical: absoluteUrl('/about') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/about'),
    title: `关于 | ${SITE_NAME}`,
    description: `关于${SITE_NAME}和作者的介绍。`,
  },
};
export default function AboutPage() { return <div className="mx-auto max-w-2xl px-6 py-12"><p className="text-sm font-medium tracking-[0.2em] text-[#b45309]">ABOUT</p><h1 className="mb-8 mt-2 text-3xl font-serif font-bold text-[#2c2c2c] md:text-4xl">关于我</h1><div className="space-y-6 leading-relaxed text-[#3f3f46]"><p>你好，欢迎来到我的博客。我是一名热爱技术与生活的开发者，在这里记录学习、思考和成长。</p><div><h2 className="mb-3 mt-8 border-b border-[#e7e2d8] pb-2 text-xl font-serif font-semibold text-[#2c2c2c]">关于这个博客</h2><p>这里是一个属于自己的安静角落，不追求流量，只认真写下那些值得留下的想法。</p><p className="mt-4">内容主要包括：</p><ul className="mt-3 list-disc space-y-1.5 pl-6"><li>前端开发技术笔记与实践心得</li><li>读过的好书和它们带来的启发</li><li>生活中的观察与思考</li><li>有趣的小项目记录</li></ul></div><div><h2 className="mb-3 mt-8 border-b border-[#e7e2d8] pb-2 text-xl font-serif font-semibold text-[#2c2c2c]">技术栈</h2><div className="mt-4 flex flex-wrap gap-2">{['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS', 'PostgreSQL'].map((tech) => <span key={tech} className="rounded-full bg-[#f3efe7] px-3 py-1 text-sm text-[#78716c]">{tech}</span>)}</div></div><div className="mt-12 border-t border-[#e7e2d8] pt-8"><blockquote className="border-l-4 border-[#b45309] pl-4 italic text-[#78716c]">写作是为了更清晰地思考。</blockquote></div></div></div>; }
