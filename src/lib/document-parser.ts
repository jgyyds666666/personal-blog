import { randomUUID } from 'node:crypto';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';
import { fromBuffer } from 'yauzl';
import type { Entry, ZipFile } from 'yauzl';
import { getDocumentFormat, MAX_DOCUMENT_SIZE } from '@/lib/document-types';
import type { DocumentFormat } from '@/lib/document-types';

const MAX_EXPANDED_SIZE = 30 * 1024 * 1024;
const MAX_CONTENT_LENGTH = 2_000_000;
const MAX_IMAGES = 100;

export class DocumentInputError extends Error {}

export interface ParsedDocumentImage {
  id: string;
  contentType: string;
  buffer: Buffer;
}

export interface ParsedDocument {
  title: string;
  excerpt: string;
  content: string;
  format: DocumentFormat;
  images: ParsedDocumentImage[];
  warnings: string[];
}

// Read ZIP directory sizes before Mammoth expands the DOCX archive.
function validateDocx(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error: Error | null, zip?: ZipFile) => {
      if (error || !zip) return reject(new DocumentInputError('Word 文件无效或已损坏。'));
      let totalSize = 0;
      let count = 0;
      let hasDocument = false;
      let readSize = 0;
      let failed = false;
      const fail = () => {
        if (failed) return;
        failed = true;
        zip.close();
        reject(new DocumentInputError('Word 文件已损坏、已加密或解压后过大，请简化文档后重试。'));
      };
      zip.on('error', fail);
      zip.on('entry', (entry: Entry) => {
        totalSize += entry.uncompressedSize;
        count += 1;
        if ((entry.generalPurposeBitFlag & 1) !== 0 || totalSize > MAX_EXPANDED_SIZE || count > 2000) return fail();
        if (entry.fileName === 'word/document.xml') hasDocument = true;
        if (entry.fileName.endsWith('/')) return zip.readEntry();
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return fail();
          stream.on('data', (chunk: Buffer) => {
            readSize += chunk.length;
            if (readSize > MAX_EXPANDED_SIZE) { stream.destroy(); fail(); }
          });
          stream.on('error', fail);
          stream.on('end', () => { if (!failed) zip.readEntry(); });
        });
      });
      zip.on('end', () => {
        zip.close();
        if (!hasDocument) reject(new DocumentInputError('该文件不是有效的 .docx 文档。'));
        else resolve();
      });
      zip.readEntry();
    });
  });
}

function decodeText(buffer: Buffer): string {
  try {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return new TextDecoder('utf-16le', { fatal: true }).decode(buffer);
    if (buffer[0] === 0xfe && buffer[1] === 0xff) return new TextDecoder('utf-16be', { fatal: true }).decode(buffer);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      return new TextDecoder('gb18030', { fatal: true }).decode(buffer);
    }
  } catch {
    throw new DocumentInputError('无法识别文本编码，请将文件另存为 UTF-8 后上传。');
  }
}

export async function parseDocument(name: string, buffer: Buffer, documentId: string): Promise<ParsedDocument> {
  const format = getDocumentFormat(name);
  if (!format) throw new DocumentInputError('仅支持 .md、.txt 和 .docx 文档。');
  if (!buffer.length || buffer.length > MAX_DOCUMENT_SIZE) throw new DocumentInputError('文档不能为空且不能超过 10MB。');
  const title = name.replace(/\.[^.]+$/, '').trim().slice(0, 255) || '未命名文档';
  const images: ParsedDocumentImage[] = [];
  const warnings: string[] = [];
  let imageCount = 0;
  let content: string;

  if (format === 'docx') {
    await validateDocx(buffer);
    try {
      const result = await mammoth.convertToHtml({ buffer }, {
        externalFileAccess: false,
        convertImage: mammoth.images.imgElement(async (image) => {
          if (!/^image\/(?:png|jpeg|gif|webp|avif)$/.test(image.contentType)) {
            warnings.push('部分图片格式暂不支持，原文件中仍保留这些图片。');
            return { src: '', alt: '暂不支持的图片' };
          }
          imageCount += 1;
          if (imageCount > MAX_IMAGES) throw new DocumentInputError('文档图片超过 100 张，请拆分后上传。');
          const imageBuffer = await image.readAsBuffer();
          if (imageBuffer.length > MAX_DOCUMENT_SIZE) throw new DocumentInputError('文档中有图片超过 10MB，请压缩后上传。');
          const id = randomUUID();
          images.push({ id, contentType: image.contentType, buffer: imageBuffer });
          return { src: `/api/documents/${documentId}/assets/${id}` };
        }),
      });
      const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
      converter.use(tables);
      converter.addRule('strikethrough', { filter: (node) => ['DEL', 'S', 'STRIKE'].includes(node.nodeName), replacement: (text) => `~~${text}~~` });
      // Word tables often do not mark their first row as a header. Use it for Markdown tables.
      converter.addRule('wordTable', {
        filter: 'table',
        replacement: (_text, node) => {
          const rows = Array.from(node.querySelectorAll('tr')).map((row) =>
            Array.from(row.querySelectorAll('th,td')).map((cell) => converter.turndown(cell.innerHTML)
              .replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim()));
          if (!rows.length) return '';
          const width = Math.max(...rows.map((row) => row.length));
          const line = (row: string[]) => `| ${Array.from({ length: width }, (_, index) => row[index] || '').join(' | ')} |`;
          return `\n\n${line(rows[0])}\n${line(Array.from({ length: width }, () => '---'))}\n${rows.slice(1).map(line).join('\n')}\n\n`;
        },
      });
      content = converter.turndown(result.value);
      if (result.messages.length) warnings.push('部分 Word 格式已简化，请以阅读页面和原文件为准。');
    } catch (error) {
      if (error instanceof DocumentInputError) throw error;
      throw new DocumentInputError('Word 文档解析失败，请确认文件未损坏或加密。');
    }
  } else {
    content = decodeText(buffer).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (content.includes('\0')) throw new DocumentInputError('文件包含无效文本，请上传有效的文本或 Markdown 文档。');
  }
  if (!content.trim()) throw new DocumentInputError('文档没有可阅读的内容。');
  if (content.length > MAX_CONTENT_LENGTH) throw new DocumentInputError('文档内容过长，请拆分后上传。');
  const excerpt = content.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*`>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
  return { title, excerpt, content, format, images, warnings: [...new Set(warnings)] };
}
