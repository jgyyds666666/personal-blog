'use client';

import { useEffect, useRef } from 'react';
import { copyText } from '@/lib/clipboard';

export function MarkdownContent({ html, className = 'post-content' }: { html: string; className?: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const contentRoot = root;
    const tableCleanups: Array<() => void> = [];
    const copyTimers = new Set<number>();
    let disposed = false;

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
  }, [html]);

  return <div ref={contentRef} data-reading-content className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
