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

interface ParsedListItem {
  content: string;
  checked?: boolean;
  children: string[];
}

interface ParsedList {
  html: string;
  nextIndex: number;
}

type ReferenceMap = Map<string, string>;

const CODE_BLOCK_TOKEN = '\u0000CODEBLOCK';
const LIST_ITEM_PATTERN = /^(\s*)([-*]|\d+[.)])\s+(.+)$/;

export function renderMarkdown(text: string): { html: string; headings: HeadingItem[] } {
  const headings: HeadingItem[] = [];
  const codeBlocks: CodeBlock[] = [];
  const references: ReferenceMap = new Map();
  const source = extractReferences(text.trim().replace(/\r\n?/g, '\n'), references);
  const protectedSource = source.replace(
    /^(```|~~~)([\w+-]*)[^\S\n]*\n([\s\S]*?)\n?^\1[^\S\n]*$/gm,
    (_match, _fence: string, language: string, code: string) => {
      const index = codeBlocks.push({ language: language || '', code: code.replace(/\n$/, '') }) - 1;
      return `${CODE_BLOCK_TOKEN}${index}\u0000`;
    }
  );
  const escapedSource = escapeHtml(protectedSource);
  const html = escapedSource
    .split(/\n\s*\n/)
    .map((block) => renderBlock(block, headings, codeBlocks, references))
    .filter(Boolean)
    .join('\n');

  return { html, headings };
}

function extractReferences(source: string, references: ReferenceMap): string {
  return source.replace(
    /^\[([^\]]+)\]:\s*<?([^>\s]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/gm,
    (_match, identifier: string, url: string) => {
      references.set(normalizeReference(identifier), url);
      return '';
    }
  );
}

function normalizeReference(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function renderBlock(
  block: string,
  headings: HeadingItem[],
  codeBlocks: CodeBlock[],
  references: ReferenceMap
): string {
  const trimmed = block.trim();
  if (!trimmed) return '';

  const codeMatch = trimmed.match(/^\u0000CODEBLOCK(\d+)\u0000$/);
  if (codeMatch) {
    const codeBlock = codeBlocks[Number(codeMatch[1])];
    if (!codeBlock) return '';
    const language = codeBlock.language.trim().toLowerCase();
    const languageAttribute = language ? ` data-language="${escapeHtml(language)}"` : '';
    return `<pre${languageAttribute}><code>${escapeHtml(codeBlock.code)}</code></pre>`;
  }

  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    return renderHeading(headingMatch[1].length, headingMatch[2].trim(), headings, references);
  }

  const setextHeading = trimmed.match(/^(.+)\n(={3,}|-{3,})$/);
  if (setextHeading) {
    return renderHeading(setextHeading[2][0] === '=' ? 1 : 2, setextHeading[1].trim(), headings, references);
  }

  if (/^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed)) {
    return '<hr>';
  }

  const table = renderTable(trimmed, references);
  if (table) return table;

  const list = renderListBlock(trimmed, references);
  if (list) return list;

  if (/^(?:&gt;\s?.*\n?)+$/.test(trimmed)) {
    return `<blockquote>${trimmed
      .split('\n')
      .map((line) => renderInlineMarkdown(line.replace(/^&gt;\s?/, ''), references))
      .join('<br>')}</blockquote>`;
  }

  return `<p>${renderInlineMarkdown(trimmed.replace(/\n/g, ' '), references)}</p>`;
}

function renderHeading(level: number, title: string, headings: HeadingItem[], references: ReferenceMap): string {
  const renderedTitle = renderInlineMarkdown(title, references);
  if (level === 1) return `<h1>${renderedTitle}</h1>`;
  const headingLevel = Math.min(level, 3) as 2 | 3;
  const id = `heading-${headings.length}`;
  headings.push({ id, title: stripHtml(renderedTitle), level: headingLevel });
  return `<h${headingLevel} id="${id}">${renderedTitle}</h${headingLevel}>`;
}

function renderListBlock(block: string, references: ReferenceMap): string | null {
  const lines = block.split('\n');
  if (!lines.length || lines.some((line) => !LIST_ITEM_PATTERN.test(line))) return null;

  const lists: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const match = lines[index].match(LIST_ITEM_PATTERN);
    if (!match) return null;
    const parsed = parseList(lines, index, getIndent(match[1]), references);
    lists.push(parsed.html);
    index = parsed.nextIndex;
  }
  return lists.join('');
}

function parseList(lines: string[], startIndex: number, baseIndent: number, references: ReferenceMap): ParsedList {
  const firstMatch = lines[startIndex].match(LIST_ITEM_PATTERN);
  if (!firstMatch) return { html: '', nextIndex: startIndex + 1 };
  const ordered = /^\d/.test(firstMatch[2]);
  const items: ParsedListItem[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(LIST_ITEM_PATTERN);
    if (!match) break;
    const indent = getIndent(match[1]);
    const currentOrdered = /^\d/.test(match[2]);
    if (indent < baseIndent || (indent === baseIndent && currentOrdered !== ordered)) break;

    if (indent > baseIndent) {
      const previous = items.at(-1);
      if (!previous) break;
      const nested = parseList(lines, index, indent, references);
      previous.children.push(nested.html);
      index = nested.nextIndex;
      continue;
    }

    const task = match[3].match(/^\[([ xX])\]\s+(.*)$/);
    items.push({
      content: renderInlineMarkdown(task ? task[2] : match[3], references),
      checked: task ? task[1].toLowerCase() === 'x' : undefined,
      children: [],
    });
    index += 1;
  }

  const tag = ordered ? 'ol' : 'ul';
  const taskClass = items.some((item) => item.checked !== undefined) ? ' class="task-list"' : '';
  const content = items.map((item) => {
    const checkbox = item.checked === undefined
      ? ''
      : `<input type="checkbox" disabled${item.checked ? ' checked' : ''}> `;
    return `<li>${checkbox}${item.content}${item.children.join('')}</li>`;
  }).join('');

  return { html: `<${tag}${taskClass}>${content}</${tag}>`, nextIndex: index };
}

function getIndent(value: string): number {
  return value.replace(/\t/g, '  ').length;
}

function renderTable(block: string, references: ReferenceMap): string | null {
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
  const cells = (row: string[], tag: 'th' | 'td') => row.map((cell, index) => {
    const align = alignments[index];
    const attribute = align ? ` align="${align}"` : '';
    return `<${tag}${attribute}>${renderInlineMarkdown(cell.trim(), references)}</${tag}>`;
  }).join('');
  const body = lines.slice(2).map((line) => {
    const row = splitTableRow(line);
    return row.length === header.length ? `<tr>${cells(row, 'td')}</tr>` : '';
  }).filter(Boolean).join('');

  return `<div class="table-scroll"><table><thead><tr>${cells(header, 'th')}</tr></thead>${body ? `<tbody>${body}</tbody>` : ''}</table></div>`;
}

function splitTableRow(line: string): string[] {
  const normalized = line.replace(/^\|\s*/, '').replace(/\s*\|$/, '');
  return normalized.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|'));
}

function renderInlineMarkdown(value: string, references: ReferenceMap): string {
  const protectedHtml: string[] = [];
  const protect = (html: string) => `\u0000INLINE${protectedHtml.push(html) - 1}\u0000`;
  let html = value.replace(/`([^`]+)`/g, (_match, code: string) => protect(`<code>${code}</code>`));

  html = html
    .replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (match, alt: string, identifier: string) => {
      const url = references.get(normalizeReference(identifier || alt));
      return url ? protect(renderImage(alt, url)) : match;
    })
    .replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (match, label: string, identifier: string) => {
      const url = references.get(normalizeReference(identifier || label));
      return url ? protect(renderLink(label, url)) : match;
    })
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (_match, alt: string, url: string) =>
      protect(renderImage(alt, url))
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (_match, label: string, url: string) =>
      protect(renderLink(label, url))
    )
    .replace(/&lt;((?:https?:\/\/|mailto:)[^&]+)&gt;/g, (_match, url: string) =>
      protect(renderLink(url.replace(/^mailto:/, ''), url))
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+?)__/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');

  return html.replace(/\u0000INLINE(\d+)\u0000/g, (_match, index: string) => protectedHtml[Number(index)] || '');
}

function renderImage(alt: string, value: string): string {
  const normalizedUrl = normalizeBlogImageUrl(unescapeHtml(value));
  return `<img src="${escapeHtml(sanitizeUrl(normalizedUrl, true))}" alt="${alt}" loading="lazy">`;
}

function renderLink(label: string, value: string): string {
  const url = sanitizeUrl(unescapeHtml(value), false);
  const externalAttributes = /^(?:https?:\/\/|mailto:|tel:)/i.test(url)
    ? ' target="_blank" rel="noopener noreferrer"'
    : '';
  return `<a href="${escapeHtml(url)}"${externalAttributes}>${label}</a>`;
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
