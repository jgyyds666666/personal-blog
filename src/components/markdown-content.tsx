'use client';

import { useEffect, useRef } from 'react';

export function MarkdownContent({ html, className = 'post-content' }: { html: string; className?: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
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
      copyButton.textContent = '复制';
      copyButton.addEventListener('click', () => void copyCode(pre, copyButton));
      toolbar.append(language, copyButton);
      pre.replaceWith(wrapper);
      wrapper.append(toolbar, pre);
    });

    return () => {
      root.querySelectorAll<HTMLButtonElement>('.code-copy-button').forEach((button) => {
        button.replaceWith(button.cloneNode(true));
      });
    };
  }, [html]);

  return <div ref={contentRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

async function copyCode(pre: HTMLPreElement, button: HTMLButtonElement) {
  const code = pre.querySelector('code')?.textContent || '';
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const fallback = document.createElement('textarea');
    fallback.value = code;
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  }
  button.textContent = '已复制';
  window.setTimeout(() => { button.textContent = '复制'; }, 1600);
}
