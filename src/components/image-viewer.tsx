'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export interface PreviewImage { src: string; alt: string; }

export function ImageViewer({ image, onClose, returnFocus }: { image: PreviewImage | null; onClose: () => void; returnFocus: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setZoom(1); setNatural({ width: 0, height: 0 }); setFailed(false);
  }, [image]);

  useEffect(() => {
    if (!viewportNode) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(viewportNode);
    return () => observer.disconnect();
  }, [viewportNode]);

  const fit = natural.width && natural.height && viewport.width && viewport.height
    ? Math.min(1, Math.max(1, viewport.width - 32) / natural.width, Math.max(1, viewport.height - 32) / natural.height)
    : 1;
  const width = natural.width * fit * zoom;
  const height = natural.height * fit * zoom;
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom((value) => Math.min(4, value + 0.5)); }
    if (event.key === '-') { event.preventDefault(); setZoom((value) => Math.max(1, value - 0.5)); }
    if (event.key === '0') { event.preventDefault(); setZoom(1); }
  }

  return <Dialog open={image !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false} aria-describedby="image-viewer-description" className="image-viewer gap-0 overflow-hidden border-[#e7e2d8] bg-[#faf8f5] p-0" onKeyDown={handleKey} onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }}>
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[#e7e2d8] px-3 py-2 sm:px-4">
        <DialogTitle className="min-w-0 flex-1 truncate text-sm text-[#2c2c2c]">{image?.alt || '查看图片'}</DialogTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-11 text-[#78716c]" disabled={zoom <= 1 || failed} aria-label="缩小图片" onClick={() => setZoom((value) => Math.max(1, value - 0.5))}><ZoomOut /></Button>
          <span className="w-12 text-center text-xs text-[#78716c]" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="size-11 text-[#78716c]" disabled={zoom >= 4 || failed} aria-label="放大图片" onClick={() => setZoom((value) => Math.min(4, value + 0.5))}><ZoomIn /></Button>
          <Button variant="ghost" size="icon" className="size-11 text-[#78716c]" aria-label="重置图片缩放" onClick={() => setZoom(1)}><RotateCcw /></Button>
          <DialogClose asChild><Button variant="ghost" size="icon" className="size-11 text-[#78716c]" aria-label="关闭图片预览"><X /></Button></DialogClose>
        </div>
      </div>
      <DialogDescription id="image-viewer-description" className="px-4 py-2 text-xs text-[#78716c]">使用缩放按钮放大，滑动或滚动查看细节。</DialogDescription>
      <div ref={setViewportNode} className="image-viewer-viewport min-h-0 overflow-auto overscroll-contain" tabIndex={0} aria-label="图片预览，可滑动查看">
        <div className="image-viewer-canvas flex items-center justify-center p-4" style={{ width: Math.max(viewport.width, width + 32), height: Math.max(viewport.height, height + 32) }}>
          {image && !failed && (
            // Native image loading preserves authenticated private asset routes.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.src} src={image.src} alt={image.alt || '文章配图'} className="block shrink-0" style={{ width: natural.width ? width : undefined, height: natural.height ? height : undefined }} onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setFailed(true)} onDoubleClick={() => setZoom((value) => value === 1 ? 2 : 1)} />
          )}
          {failed && <p role="alert" className="text-sm text-[#78716c]">图片加载失败，请关闭后重试。</p>}
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
