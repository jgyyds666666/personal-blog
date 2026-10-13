'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { copyText } from '@/lib/clipboard';
import { ImageViewer, type PreviewImage } from '@/components/image-viewer';

export function MarkdownContent({ html, className = 'post-content' }: { html: string; className?: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewTrigger = useRef<HTMLButtonElement | null>(null);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  // Preview state must not replace the HTML node containing enhanced tables, code and images.
  const content = useMemo(() => <div ref={contentRef} data-reading-content className={className} dangerouslySetInnerHTML={{ __html: html }} />, [html, className]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const contentRoot = root;
    const tableCleanups: Array<() => void> = [];
    const copyTimers = new Set<number>();
    let disposed = false;

    // Preserve images that are already links; other images become keyboard-accessible previews.
    contentRoot.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (img.closest('a, button')) return;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'image-preview-trigger';
      trigger.setAttribute('aria-label', `查看大图：${img.alt || '文章配图'}`);
      trigger.setAttribute('aria-haspopup', 'dialog');
      img.replaceWith(trigger);
      trigger.appendChild(img);
    });

    contentRoot.querySelectorAll<HTMLDivElement>('.table-scroll').forEach((scroller) => {
      const table = scroller.querySelector('table');
      if (!table) return;
      let block = scroller.parentElement;
      if (!block?.classList.contains('table-block')) {
        block = document.createElement('div');
        block.className = 'table-block';
        const hint = document.createElement('p');
        hint.className = 'table-scroll-hint';
        hint.textContent = '左右滑动查看完整表格';
        scroller.replaceWith(block);
        block.append(hint, scroller);
      }
      const tableBlock = block;
      const hint = tableBlock.querySelector<HTMLParagraphElement>('.table-scroll-hint');
      const update = () => {
        const overflow = scroller.scrollWidth > scroller.clientWidth + 1;
        tableBlock.dataset.overflow = String(overflow);
        tableBlock.dataset.scrolled = String(scroller.scrollLeft > 1);
        tableBlock.dataset.end = String(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
        if (hint) hint.hidden = !overflow;
        scroller.tabIndex = overflow ? 0 : -1;
        scroller.setAttribute('role', 'region');
        scroller.setAttribute('aria-label', overflow ? '文章表格，可左右滑动' : '文章表格');
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(scroller);
      observer.observe(table);
      scroller.addEventListener('scroll', update, { passive: true });
      tableCleanups.push(() => { observer.disconnect(); scroller.removeEventListener('scroll', update); });
    });

    contentRoot.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      const toolbar = document.createElement('div');
      toolbar.className = 'code-block-toolbar';
      const language = document.createElement('span');
      language.textContent = pre.dataset.language || '代码';
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'code-copy-button';
      copyButton.setAttribute('aria-label', '复制代码');
      copyButton.setAttribute('aria-live', 'polite');
      copyButton.textContent = '复制';
      toolbar.append(language, copyButton);
      pre.replaceWith(wrapper);
      wrapper.append(toolbar, pre);
    });

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const imageTrigger = target.closest<HTMLButtonElement>('.image-preview-trigger');
      if (imageTrigger && contentRoot.contains(imageTrigger)) {
        const img = imageTrigger.querySelector('img');
        if (img) { previewTrigger.current = imageTrigger; setPreviewImage({ src: img.currentSrc || img.src, alt: img.alt }); }
        return;
      }
      const button = target.closest<HTMLButtonElement>('.code-copy-button');
      if (!button || !contentRoot.contains(button)) return;
      const pre = button.closest('.code-block-wrapper')?.querySelector('pre');
      if (pre) {
        void copyText(pre.querySelector('code')?.textContent || '').then(
          () => { button.textContent = '已复制'; },
          () => { button.textContent = '复制失败'; },
        ).then(() => {
          if (disposed) return;
          const timer = window.setTimeout(() => { button.textContent = '复制'; copyTimers.delete(timer); }, 1800);
          copyTimers.add(timer);
        });
      }
    }

    contentRoot.addEventListener('click', handleClick);

    return () => {
      disposed = true;
      contentRoot.removeEventListener('click', handleClick);
      tableCleanups.forEach((cleanup) => cleanup());
      copyTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [html, className]);

  return <>{content}<ImageViewer image={previewImage} onClose={() => setPreviewImage(null)} returnFocus={() => previewTrigger.current?.focus({ preventScroll: true })} /></>;
}
