import MarkdownIt, { type Token } from 'markdown-it';
import { normalizeBlogImageUrl } from '@/lib/blog-images';

export interface HeadingItem {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

const markdown = new MarkdownIt({ html: false, linkify: true });

function sanitizeUrl(value: string, isImage = false): string {
  const url = value.trim();
  // Keep private asset URLs and stable blog image routes on the same origin.
  if (/^\/(?![\\/])/.test(url)) return url;
  return (isImage ? /^https?:\/\//i : /^(?:https?:\/\/|mailto:|tel:|#)/i).test(url) ? url : '#';
}

markdown.renderer.rules.link_open = (tokens, index, options, _env, renderer) => {
  const token = tokens[index];
  const href = sanitizeUrl(String(token.attrGet('href') || ''));
  token.attrSet('href', href);
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return renderer.renderToken(tokens, index, options);
};

const renderImage = markdown.renderer.rules.image;
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  token.attrSet('src', sanitizeUrl(normalizeBlogImageUrl(String(token.attrGet('src') || '')), true));
  token.attrSet('loading', 'lazy');
  token.attrSet('decoding', 'async');
  return renderImage ? renderImage(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options);
};

markdown.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index];
  const language = token.info.trim().split(/\s+/)[0] || '';
  const attribute = language ? ` data-language="${markdown.utils.escapeHtml(language)}"` : '';
  return `<pre${attribute}><code>${markdown.utils.escapeHtml(token.content)}</code></pre>\n`;
};

markdown.renderer.rules.table_open = (tokens, index) => {
  let columns = 0;
  for (let cursor = index + 1; cursor < tokens.length && tokens[cursor].type !== 'thead_close'; cursor += 1) {
    if (tokens[cursor].type === 'th_open') columns += 1;
  }
  return `<div class="table-scroll"><table${columns > 3 ? ' class="wide-table"' : ''}>\n`;
};
markdown.renderer.rules.table_close = () => '</table></div>\n';
markdown.renderer.rules.task_checkbox = (tokens, index) => {
  const token = tokens[index];
  return `<input type="checkbox" disabled${token.attrGet('checked') ? ' checked' : ''}> ${markdown.utils.escapeHtml(token.content)}`;
};

/** Read the visible heading label without losing escaped characters or formatting. */
function getHeadingTitle(tokens: Token[]): string {
  return tokens.map((token) => {
    if (token.type === 'image') return getHeadingTitle(token.children || []);
    if (token.type === 'text' || token.type === 'code_inline') return token.content;
    if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
    return '';
  }).join('').trim();
}

export function renderMarkdown(text: string, options: { includeTopLevelHeadings?: boolean } = {}): { html: string; headings: HeadingItem[] } {
  const tokens = markdown.parse(text.replace(/\r\n?/g, '\n'), {});
  const headings: HeadingItem[] = [];
  const lists: Token[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const level = Number(token.tag.slice(1)) as HeadingItem['level'];
      if (level === 1 && options.includeTopLevelHeadings === false) continue;
      const id = `heading-${headings.length}`;
      token.attrSet('id', id);
      headings.push({ id, title: getHeadingTitle(tokens[index + 1]?.children || []), level });
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') lists.push(token);
    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') lists.pop();

    // Only interpret a task marker at the beginning of a list item, including nested lists.
    if (token.type !== 'inline' || tokens[index - 1]?.type !== 'paragraph_open' || tokens[index - 2]?.type !== 'list_item_open') continue;
    const first = token.children?.[0];
    const task = first?.type === 'text' ? first.content.match(/^\[([ xX])\]\s+/) : null;
    if (!task || !first) continue;
    first.content = first.content.slice(task[0].length);
    first.type = 'task_checkbox';
    if (task[1].toLowerCase() === 'x') first.attrSet('checked', 'true');
    const list = lists.at(-1);
    if (list?.attrGet('class') !== 'task-list') list?.attrJoin('class', 'task-list');
  }

  return { html: markdown.renderer.render(tokens, markdown.options, {}), headings };
}
