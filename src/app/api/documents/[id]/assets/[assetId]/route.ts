import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { DOCUMENT_BUCKET, getDocumentClient, getPrivateDocument } from '@/lib/documents-service';
import { documentError, documentUnauthorized, PRIVATE_HEADERS } from '@/lib/document-http';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string; assetId: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  try {
    const { id, assetId } = await params;
    const document = await getPrivateDocument(id);
    const asset = document?.assets.find((item) => item.id === assetId);
    if (!document || !asset || !asset.key.startsWith(`${document.id}/images/`)) {
      return NextResponse.json({ error: '图片不存在。' }, { status: 404, headers: PRIVATE_HEADERS });
    }
    if (!/^image\/(?:png|jpeg|gif|webp|avif)$/.test(asset.contentType)) {
      return NextResponse.json({ error: '图片格式无效。' }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const { data, error } = await getDocumentClient().storage.from(DOCUMENT_BUCKET).download(asset.key);
    if (error || !data) throw error ?? new Error('图片读取失败');
    return new Response(data, { headers: { ...PRIVATE_HEADERS, 'Content-Type': asset.contentType, 'Content-Disposition': 'inline' } });
  } catch (error) {
    return documentError(error);
  }
}
