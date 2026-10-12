import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deletePrivateDocument, getPrivateDocument, renamePrivateDocument } from '@/lib/documents-service';
import { DocumentInputError } from '@/lib/document-parser';
import { documentError, documentUnauthorized, PRIVATE_HEADERS } from '@/lib/document-http';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  try {
    const { id } = await params;
    const document = await getPrivateDocument(id);
    if (!document) return NextResponse.json({ success: false, error: '文档不存在。' }, { status: 404, headers: PRIVATE_HEADERS });
    const payload: unknown = await request.json();
    const title = payload && typeof payload === 'object' && 'title' in payload && typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title || title.length > 255) throw new DocumentInputError('标题不能为空且不能超过 255 个字符。');
    await renamePrivateDocument(id, title);
    revalidatePath('/');
    revalidatePath(`/documents/${id}`);
    return NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return documentError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  try {
    const document = await getPrivateDocument((await params).id);
    if (!document) return NextResponse.json({ success: false, error: '文档不存在。' }, { status: 404, headers: PRIVATE_HEADERS });
    await deletePrivateDocument(document);
    revalidatePath('/');
    revalidatePath(`/documents/${document.id}`);
    return NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return documentError(error);
  }
}
