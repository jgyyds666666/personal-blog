'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { captureReadingPosition, getResumeScrollTop, readReadingPosition, writeReadingPosition, type ReadingPosition } from '@/lib/reading-position';

export function ReadingResume({ id, contentVersion }: { id: string; contentVersion: string }) {
  const [saved, setSaved] = useState<ReadingPosition | null>(null);
  const [restore, setRestore] = useState<ReadingPosition | null>(null);
  const canSave = useRef(false);

  useEffect(() => {
    const content = document.querySelector<HTMLElement>('[data-reading-content]');
    if (!content) return;
    const previous = readReadingPosition(id, contentVersion);
    const resumable = previous && previous.progress >= 5 && previous.progress < 99;
    // An explicit chapter link takes precedence over a saved position.
    canSave.current = !resumable || Boolean(window.location.hash);
    setSaved(resumable && !window.location.hash ? previous : null);
    let timer: number | undefined;
    const persist = () => {
      if (!canSave.current || !content.isConnected) return;
      const position = captureReadingPosition(content, contentVersion);
      if (position.progress >= 99) writeReadingPosition(id, null);
      else if (position.progress >= 5) writeReadingPosition(id, position);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(persist, 500);
    };
    const onIntent = (event: Event) => {
      if (event instanceof KeyboardEvent && !['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' ', 'Home', 'End'].includes(event.key)) return;
      canSave.current = true;
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      if (anchor.getAttribute('href')?.startsWith('#')) canSave.current = true;
      else persist();
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') persist(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onIntent, { passive: true });
    window.addEventListener('touchmove', onIntent, { passive: true });
    window.addEventListener('keydown', onIntent);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', onClick);
    return () => {
      window.clearTimeout(timer);
      persist();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onIntent);
      window.removeEventListener('touchmove', onIntent);
      window.removeEventListener('keydown', onIntent);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onClick);
    };
  }, [id, contentVersion]);

  useEffect(() => {
    if (!restore) return;
    const content = document.querySelector<HTMLElement>('[data-reading-content]');
    if (!content) return;
    const update = () => window.scrollTo({ top: getResumeScrollTop(content, restore), behavior: 'auto' });
    const observer = new ResizeObserver(update);
    observer.observe(content);
    const frame = window.requestAnimationFrame(() => {
      update();
      const target = restore.headingId ? document.getElementById(restore.headingId) || content : content;
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
    // Keep the section in place while images load, until the user takes control.
    const stop = () => observer.disconnect();
    const timer = window.setTimeout(stop, 10_000);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    window.addEventListener('pointerdown', stop);
    return () => {
      observer.disconnect(); window.cancelAnimationFrame(frame); window.clearTimeout(timer);
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop); window.removeEventListener('pointerdown', stop);
    };
  }, [restore]);

  if (!saved) return null;
  return <Alert role="status" aria-label="继续上次阅读" className="mb-6 border-[#e7e2d8] bg-white/60 text-[#4b5563]">
    <BookOpen className="text-[#b45309]" />
    <AlertTitle>上次读到 {Math.round(saved.progress)}%</AlertTitle>
    <AlertDescription className="mt-2 flex flex-wrap gap-2">
      <Button size="sm" className="min-h-11 bg-[#b45309] text-white hover:bg-[#92400e]" onClick={() => { canSave.current = true; setRestore(saved); setSaved(null); }}>继续阅读</Button>
      <Button size="sm" variant="ghost" className="min-h-11 text-[#78716c]" onClick={() => { canSave.current = true; writeReadingPosition(id, null); setSaved(null); }}>从头开始</Button>
    </AlertDescription>
  </Alert>;
}
