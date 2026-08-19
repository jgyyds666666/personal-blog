import { normalizeBlogImageUrl } from '@/lib/blog-images';

export interface HeadingItem {
  id: string;
  title: string;
  level: 2 | 3;
}

interface CodeBlock {
  language: string;
  code: string;
}

const CODE_BLOCK_TOKEN = '\u0000CODE_BLOCK_';

export function renderMarkdown(text: string): { html: string; headings: HeadingItem[] } {
  const headings: HeadingItem[] = [];
  const codeBlocks: CodeBlock[] = [];
  const source = text.trim().replace(/\r\n?/g, '\n');
  const protectedSource = source.replace(
    /^```([\w+-]*)\s*\n([\s\S]*?)\n?```$/gm,
    (_match, language: string, code: string) => {
      const index = codeBlocks.push({ language: language || '', code: code.replace(/\n$/, '') }) - 1;
      return `${CODE_BLOCK_TOKEN}${index}\u0000`;
    }
  );
  const escapedSource = escapeHtml(protectedSource);
  const html = escapedSource
    .split(/\n\s*\n/)
    .map((block) => renderBlock(block, headings, codeBlocks))
    .filter(Boolean)
    .join('\n');

  return { html, headings };
}

function renderBlock(block: string, headings: HeadingItem[], codeBlocks: CodeBlock[]): string {
  const trimmed = block.trim();
  if (!trimmed) return '';

  const codeMatch = trimmed.match(/^\u0000CODE_BLOCK_(\d+)\u0000$/);
  if (codeMatch) {
    const codeBlock = codeBlocks[Number(codeMatch[1])];
    if (!codeBlock) return '';
    const language = codeBlock.language.trim().toLowerCase();
    const languageAttribute = language ? ` data-language="${escapeHtml(language)}"` : '';
    return `<pre${languageAttribute}><code>${escapeHtml(codeBlock.code)}</code></pre>`;
  }

  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const title = headingMatch[2].trim();
    if (level === 1) return `<h1>${title}</h1>`;
    const headingLevel = level as 2 | 3;
    const id = `heading-${headings.length}`;
    headings.push({ id, title: stripHtml(title), level: headingLevel });
    return `<h${headingLevel} id="${id}">${title}</h${headingLevel}>`;
  }

  if (/^(?:[-*]\s+.+\n?)+$/.test(trimmed)) {
    return `<ul>${trimmed
      .split('\n')
      .map((line) => `<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      .join('')}</ul>`;
  }

  if (/^(?:\d+[.)]\s+.+\n?)+$/.test(trimmed)) {
    return `<ol>${trimmed
      .split('\n')
      .map((line) => `<li>${line.replace(/^\d+[.)]\s+/, '')}</li>`)
      .join('')}</ol>`;
  }

  if (/^(?:&gt;\s?.*\n?)+$/.test(trimmed)) {
    return `<blockquote>${trimmed
      .split('\n')
      .map((line) => line.replace(/^&gt;\s?/, ''))
      .join('<br>')}</blockquote>`;
  }

  return `<p>${renderInlineMarkdown(trimmed.replace(/\n/g, ' '))}</p>`;
}

function renderInlineMarkdown(value: string): string {
  const inlineCode: string[] = [];
  let html = value.replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = inlineCode.push(`<code>${code}</code>`) - 1;
    return `\u0000INLINE_CODE_${index}\u0000`;
  });

  html = html
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (_match, alt: string, url: string) => {
      const normalizedUrl = normalizeBlogImageUrl(unescapeHtml(url));
      return `<img src="${escapeHtml(sanitizeUrl(normalizedUrl, true))}" alt="${alt}" loading="lazy">`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (_match, label: string, url: string) =>
      `<a href="${escapeHtml(sanitizeUrl(unescapeHtml(url), false))}" target="_blank" rel="noopener noreferrer">${label}</a>`
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+?)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');

  return html.replace(/\u0000INLINE_CODE_(\d+)\u0000/g, (_match, index: string) => inlineCode[Number(index)] || '');
}

function sanitizeUrl(value: string, isImage: boolean): string {
  const url = value.trim();
  if (isImage) return /^(?:https?:\/\/|\/media\/|\/)/i.test(url) ? url : '#';
  return /^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(url) ? url : '#';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescapeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}
