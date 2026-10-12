import { NextResponse } from 'next/server';
import { DocumentInputError } from '@/lib/document-parser';
import { DocumentConfigurationError } from '@/lib/documents-service';
import { MAX_DOCUMENT_SIZE } from '@/lib/document-types';

export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };

export function documentUnauthorized() {
  return NextResponse.json({ success: false, error: '登录已失效，请重新登录。' }, { status: 401, headers: PRIVATE_HEADERS });
}

export function documentError(error: unknown) {
  const known = error instanceof DocumentInputError || error instanceof DocumentConfigurationError;
  if (!known) console.error('私人文档操作失败:', error);
  return NextResponse.json({ success: false, error: known ? error.message : '文档操作失败，请稍后重试。' }, {
    status: error instanceof DocumentInputError ? 400 : error instanceof DocumentConfigurationError ? 503 : 500,
    headers: PRIVATE_HEADERS,
  });
}

export async function readDocumentForm(request: Request): Promise<FormData> {
  const limit = MAX_DOCUMENT_SIZE + 256 * 1024;
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new DocumentInputError('请选择需要上传的文档。');
  if (Number(request.headers.get('content-length')) > limit) throw new DocumentInputError('文档不能超过 10MB。');
  const reader = request.body?.getReader();
  if (!reader) throw new DocumentInputError('未找到文档文件。');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new DocumentInputError('文档不能超过 10MB。');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const body = Buffer.concat(chunks);
    return await new Response(body, { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
  } catch {
    throw new DocumentInputError('上传数据无效，请重新选择文档。');
  }
}
