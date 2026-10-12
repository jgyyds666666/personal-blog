'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, List } from 'lucide-react';
import Link from 'next/link';

export interface HeadingItem { id: string; title: string; level: 2 | 3; }

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-[#e7e2d8]/70" aria-hidden="true"><div className="h-full bg-[#b45309] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>;
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }
  return <button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e2d8] px-3 py-1.5 text-xs text-[#6b7280] transition-colors hover:border-[#b45309] hover:text-[#b45309]" aria-label="复制文章链接">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? '已复制' : '复制链接'}</button>;
}

export function TableOfContents({ headings }: { headings: HeadingItem[] }) {
  if (headings.length === 0) return null;
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <details className="group rounded-xl border border-[#e7e2d8] bg-white/60 p-4 lg:block" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#4b5563] lg:cursor-default">
          <List className="size-4 text-[#b45309]" />文章目录
          <span className="ml-auto text-xs text-[#9ca3af] lg:hidden">展开</span>
        </summary>
        <nav aria-label="文章目录" className="mt-3 max-h-[60dvh] space-y-1.5 overflow-y-auto overscroll-y-contain border-l border-[#e7e2d8] pl-3 pr-2 lg:max-h-[calc(100dvh-12rem)]">
          {headings.map((heading) => (
            <Link key={heading.id} href={`#${heading.id}`} className={`block text-sm leading-relaxed text-[#78716c] transition-colors hover:text-[#b45309] ${heading.level === 3 ? 'pl-3 text-xs' : ''}`}>
              {heading.title}
            </Link>
          ))}
        </nav>
      </details>
    </aside>
  );
}

export function PostNavigation({ previous, next }: { previous?: { slug: string; title: string }; next?: { slug: string; title: string } }) {
  return <nav className="mt-14 grid gap-3 border-t border-[#e7e2d8] pt-6 sm:grid-cols-2" aria-label="文章导航">{previous ? <Link href={`/posts/${previous.slug}`} className="rounded-xl border border-[#e7e2d8] bg-white/50 p-4 transition-colors hover:border-[#b45309]"><span className="text-xs text-[#9ca3af]">上一篇</span><span className="mt-1 block line-clamp-2 font-serif text-[#2c2c2c]">{previous.title}</span></Link> : <span />}{next ? <Link href={`/posts/${next.slug}`} className="rounded-xl border border-[#e7e2d8] bg-white/50 p-4 text-left transition-colors hover:border-[#b45309] sm:text-right"><span className="text-xs text-[#9ca3af]">下一篇</span><span className="mt-1 block line-clamp-2 font-serif text-[#2c2c2c]">{next.title}</span></Link> : <span />}</nav>;
}
