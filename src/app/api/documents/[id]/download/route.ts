import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { DOCUMENT_BUCKET, getDocumentClient, getPrivateDocument } from '@/lib/documents-service';
import { documentError, documentUnauthorized, PRIVATE_HEADERS } from '@/lib/document-http';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  try {
    const document = await getPrivateDocument((await params).id);
    if (!document || document.original_key !== `${document.id}/original.${document.format}`) {
      return NextResponse.json({ error: '文档不存在。' }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const { data, error } = await getDocumentClient().storage.from(DOCUMENT_BUCKET).download(document.original_key);
    if (error || !data) throw error ?? new Error('文档读取失败');
    const name = encodeURIComponent(document.original_name).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(data, { headers: {
      ...PRIVATE_HEADERS, 'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="document.${document.format}"; filename*=UTF-8''${name}`,
    } });
  } catch (error) {
    return documentError(error);
  }
}
