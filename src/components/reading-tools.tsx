'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Copy, List } from 'lucide-react';
import Link from 'next/link';
import type { HeadingItem } from '@/lib/markdown';
import { copyText } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export type { HeadingItem } from '@/lib/markdown';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const content = document.querySelector<HTMLElement>('[data-reading-content]');
    if (!content) return;
    let frame = 0;
    const update = () => {
      const bounds = content.getBoundingClientRect();
      const start = Math.max(0, bounds.top + window.scrollY - 80);
      const end = bounds.bottom + window.scrollY - window.innerHeight;
      setProgress(end > start ? Math.min(100, Math.max(0, ((window.scrollY - start) / (end - start)) * 100)) : bounds.bottom <= window.innerHeight ? 100 : 0);
    };
    const schedule = () => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(content);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  return <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-[#e7e2d8]/70" aria-hidden="true"><div className="h-full bg-[#b45309] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>;
}

export function CopyLinkButton() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copyLink() {
    try { await copyText(window.location.href); setStatus('copied'); } catch { setStatus('failed'); }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 1800);
  }
  return <Button variant="outline" onClick={() => void copyLink()} className="min-h-11 rounded-full border-[#e7e2d8] bg-transparent px-3 text-xs text-[#6b7280] hover:border-[#b45309] hover:text-[#b45309]" aria-label="复制文章链接" aria-live="polite">{status === 'copied' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{status === 'copied' ? '已复制' : status === 'failed' ? '复制失败，请重试' : '复制链接'}</Button>;
}

function useActiveHeading(headings: HeadingItem[]) {
  const [activeId, setActiveId] = useState(headings[0]?.id || '');
  useEffect(() => {
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter((element): element is HTMLElement => element !== null);
    const content = elements[0]?.closest<HTMLElement>('[data-reading-content]');
    let frame = 0;
    const update = () => {
      let current = elements[0]?.id || '';
      for (const element of elements) {
        if (element.getBoundingClientRect().top > 112) break;
        current = element.id;
      }
      // The last section may be too short to reach the top of a tall desktop viewport.
      if (content && window.scrollY > 0 && content.getBoundingClientRect().bottom <= window.innerHeight + 1) current = elements.at(-1)?.id || current;
      setActiveId(current);
    };
    const schedule = () => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [headings]);
  return activeId;
}

function ContentsLinks({ headings, activeId, onSelect }: { headings: HeadingItem[]; activeId: string; onSelect?: (id: string) => void }) {
  const baseLevel = Math.min(...headings.map((heading) => heading.level));
  return <nav aria-label="文章目录" className="toc-links min-h-0 overflow-y-auto overscroll-y-contain">
    {headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} onClick={() => onSelect?.(heading.id)} aria-current={activeId === heading.id ? 'location' : undefined} className="toc-link" style={{ paddingLeft: `${12 + Math.min(3, Math.max(0, heading.level - baseLevel)) * 12}px` }}>{heading.title}</a>)}
  </nav>;
}

export function TableOfContents({ headings, variant = 'desktop' }: { headings: HeadingItem[]; variant?: 'mobile' | 'desktop' }) {
  const activeId = useActiveHeading(headings);
  const [open, setOpen] = useState(false);
  const selected = useRef<string | null>(null);
  const mobileNav = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const nav = mobileNav.current?.querySelector('nav');
      const active = nav?.querySelector<HTMLElement>('[aria-current="location"]');
      if (nav && active) nav.scrollTop = Math.max(0, active.offsetTop - nav.offsetTop - nav.clientHeight / 2);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);
  if (headings.length === 0) return null;

  if (variant === 'mobile') return (
    <div className="mb-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="outline" className="h-12 w-full justify-start rounded-xl border-[#e7e2d8] bg-white/60 text-[#4b5563]" aria-label="查看文章目录"><List className="text-[#b45309]" />文章目录<span className="text-xs text-[#78716c]">{headings.length} 个章节</span><ChevronRight className="ml-auto" /></Button></SheetTrigger>
        <SheetTrigger asChild><Button className="mobile-toc-button fixed right-4 z-40 h-11 rounded-full bg-[#b45309] px-4 text-white shadow-lg hover:bg-[#92400e]" aria-label="打开文章目录"><List />目录</Button></SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80dvh] gap-0 rounded-t-2xl border-[#e7e2d8] bg-[#faf8f5]" onCloseAutoFocus={(event) => {
          if (!selected.current) return;
          event.preventDefault();
          const heading = document.getElementById(selected.current);
          heading?.setAttribute('tabindex', '-1');
          heading?.focus({ preventScroll: true });
          selected.current = null;
        }}>
          <SheetHeader className="pr-12"><SheetTitle className="flex items-center gap-2 text-[#2c2c2c]"><List className="size-4 text-[#b45309]" />文章目录</SheetTitle><SheetDescription>选择章节跳转，当前章节已标记。</SheetDescription></SheetHeader>
          <div ref={mobileNav} className="mobile-toc-list min-h-0 overflow-hidden px-4"><ContentsLinks headings={headings} activeId={activeId} onSelect={(id) => { selected.current = id; setOpen(false); }} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <aside className="desktop-toc hidden min-w-0 lg:sticky lg:top-24 lg:block lg:self-start">
      <div className="rounded-xl border border-[#e7e2d8] bg-white/60 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#4b5563]"><List className="size-4 text-[#b45309]" />文章目录</h2>
        <ContentsLinks headings={headings} activeId={activeId} />
      </div>
    </aside>
  );
}

export function PostNavigation({ previous, next }: { previous?: { slug: string; title: string }; next?: { slug: string; title: string } }) {
  return <nav className="mt-14 grid gap-3 border-t border-[#e7e2d8] pt-6 sm:grid-cols-2" aria-label="文章导航">{previous ? <Link href={`/posts/${previous.slug}`} className="rounded-xl border border-[#e7e2d8] bg-white/50 p-4 transition-colors hover:border-[#b45309]"><span className="text-xs text-[#9ca3af]">上一篇</span><span className="mt-1 block line-clamp-2 font-serif text-[#2c2c2c]">{previous.title}</span></Link> : <span />}{next ? <Link href={`/posts/${next.slug}`} className="rounded-xl border border-[#e7e2d8] bg-white/50 p-4 text-left transition-colors hover:border-[#b45309] sm:text-right"><span className="text-xs text-[#9ca3af]">下一篇</span><span className="mt-1 block line-clamp-2 font-serif text-[#2c2c2c]">{next.title}</span></Link> : <span />}</nav>;
}
