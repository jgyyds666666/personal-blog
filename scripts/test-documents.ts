import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { makeWord } from './fixtures/docx';
import { parseDocument, DocumentInputError } from '../src/lib/document-parser';
import { getDocumentFormat, MAX_DOCUMENT_SIZE } from '../src/lib/document-types';
import { renderMarkdown } from '../src/lib/markdown';
import { validatePostInput } from '../src/lib/post-validation';

const id = '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  assert.equal(getDocumentFormat('笔记.DOCX'), 'docx');
  assert.equal(getDocumentFormat('report.pdf'), null);
  assert.equal(getDocumentFormat('md'), null);
  const postInput = { title: '文章标题', content: '文章内容' };
  for (const slug of ['我的文章', 'react-19_notes', '中文-English_123', 'Ελληνικά-١٢٣']) assert.ok(validatePostInput({ ...postInput, slug }).data);
  for (const slug of ['内容/路径', 'emoji-😀', '<script>']) assert.ok(validatePostInput({ ...postInput, slug }).error);
  const markdown = await parseDocument('学习.md', Buffer.from('# 第一章\n\n正文 **重点**\n\n<script>alert(1)</script>'), id);
  const rendered = renderMarkdown(markdown.content, { includeTopLevelHeadings: true });
  assert.equal(markdown.title, '学习');
  assert.equal(rendered.headings[0]?.title, '第一章');
  assert.match(rendered.html, /<strong>重点<\/strong>/);
  assert.doesNotMatch(rendered.html, /<script>/);
  const text = await parseDocument('记录.txt', Buffer.from('\uFEFF第一行\r\n# 原样文字'), id);
  assert.equal(text.content, '第一行\n# 原样文字');
  const utf16 = await parseDocument('中文.txt', Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('中文内容', 'utf16le')]), id);
  assert.equal(utf16.content, '中文内容');
  const gb = await parseDocument('旧编码.txt', Buffer.from([0xd6, 0xd0, 0xce, 0xc4]), id);
  assert.equal(gb.content, '中文');
  const word = await parseDocument('Word 文档.docx', await makeWord(), id);
  const wordHtml = renderMarkdown(word.content, { includeTopLevelHeadings: true });
  assert.match(wordHtml.html, /<strong>重点<\/strong>/);
  assert.match(wordHtml.html, /<table>/);
  assert.match(wordHtml.html, /<td>苹果<\/td>/);
  assert.match(wordHtml.html, /a_b_c 和 \*星号\*/);
  assert.equal(word.images.length, 1);
  assert.match(wordHtml.html, new RegExp(`/api/documents/${id}/assets/`));
  assert.doesNotMatch(wordHtml.html, /data:image|public\/|blog-images/);
  await assert.rejects(parseDocument('空.txt', Buffer.alloc(0), id), DocumentInputError);
  await assert.rejects(parseDocument('空.md', Buffer.from('  \n'), id), DocumentInputError);
  await assert.rejects(parseDocument('大.md', Buffer.alloc(MAX_DOCUMENT_SIZE + 1), id), DocumentInputError);
  await assert.rejects(parseDocument('旧.doc', Buffer.from('内容'), id), DocumentInputError);
  await assert.rejects(parseDocument('损坏.docx', Buffer.from('not a zip'), id), DocumentInputError);
  await assert.rejects(parseDocument('二进制.txt', Buffer.from([1, 0, 2]), id), DocumentInputError);
  const fixtureRequire = createRequire(createRequire(import.meta.url).resolve('mammoth'));
  const Zip = fixtureRequire('jszip') as new () => { file(name: string, data: Buffer): void; generateAsync(options: { type: 'nodebuffer'; compression: 'DEFLATE' }): Promise<Buffer> };
  const bomb = new Zip();
  bomb.file('word/document.xml', Buffer.alloc(31 * 1024 * 1024, 32));
  await assert.rejects(parseDocument('解压过大.docx', await bomb.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), id), DocumentInputError);
  console.log('Document parsing checks passed: formats, Word table/image, encodings, escaping, invalid files and ZIP expansion limits.');
}

void main();
