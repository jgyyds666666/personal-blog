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
    const renderedTitle = renderInlineMarkdown(title);
    if (level === 1) return `<h1>${renderedTitle}</h1>`;
    const headingLevel = level as 2 | 3;
    const id = `heading-${headings.length}`;
    headings.push({ id, title: stripHtml(renderedTitle), level: headingLevel });
    return `<h${headingLevel} id="${id}">${renderedTitle}</h${headingLevel}>`;
  }

  const table = renderTable(trimmed);
  if (table) return table;

  if (/^(?:[-*]\s+.+\n?)+$/.test(trimmed)) {
    const taskItems = trimmed.split('\n').map((line) => line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/));
    if (taskItems.every(Boolean)) {
      return `<ul class="task-list">${taskItems.map((item) => {
        const task = item as RegExpMatchArray;
        const checked = task[1].toLowerCase() === 'x' ? ' checked' : '';
        return `<li><input type="checkbox" disabled${checked}> ${renderInlineMarkdown(task[2])}</li>`;
      }).join('')}</ul>`;
    }
    return `<ul>${trimmed
      .split('\n')
      .map((line) => `<li>${renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`)
      .join('')}</ul>`;
  }

  if (/^(?:\d+[.)]\s+.+\n?)+$/.test(trimmed)) {
    return `<ol>${trimmed
      .split('\n')
      .map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+[.)]\s+/, ''))}</li>`)
      .join('')}</ol>`;
  }

  if (/^(?:&gt;\s?.*\n?)+$/.test(trimmed)) {
    return `<blockquote>${trimmed
      .split('\n')
      .map((line) => renderInlineMarkdown(line.replace(/^&gt;\s?/, '')))
      .join('<br>')}</blockquote>`;
  }

  return `<p>${renderInlineMarkdown(trimmed.replace(/\n/g, ' '))}</p>`;
}

function renderTable(block: string): string | null {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[1])) {
    return null;
  }

  const header = splitTableRow(lines[0]);
  const separator = splitTableRow(lines[1]);
  if (!header.length || header.length !== separator.length) return null;

  const alignments = separator.map((cell) => {
    const value = cell.trim();
    if (value.startsWith(':') && value.endsWith(':')) return 'center';
    if (value.startsWith(':')) return 'left';
    if (value.endsWith(':')) return 'right';
    return undefined;
  });
  const renderCell = (cell: string) => renderInlineMarkdown(cell.trim());
  const cells = (row: string[], tag: 'th' | 'td') => row.map((cell, index) => {
    const align = alignments[index];
    const attribute = align ? ` align="${align}"` : '';
    return `<${tag}${attribute}>${renderCell(cell)}</${tag}>`;
  }).join('');
  const body = lines.slice(2).map((line) => {
    const row = splitTableRow(line);
    if (row.length !== header.length) return '';
    return `<tr>${cells(row, 'td')}</tr>`;
  }).filter(Boolean).join('');

  return `<div class="table-scroll"><table><thead><tr>${cells(header, 'th')}</tr></thead>${body ? `<tbody>${body}</tbody>` : ''}</table></div>`;
}

function splitTableRow(line: string): string[] {
  const normalized = line.replace(/^\|\s*/, '').replace(/\s*\|$/, '');
  return normalized.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|'));
}

function renderInlineMarkdown(value: string): string {
  const inlineCode: string[] = [];
  let html = value.replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = inlineCode.push(`<code>${code}</code>`) - 1;
    return `\u0000INLINECODE${index}\u0000`;
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
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');

  return html.replace(/\u0000INLINECODE(\d+)\u0000/g, (_match, index: string) => inlineCode[Number(index)] || '');
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
