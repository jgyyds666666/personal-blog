import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { parseDocument, DocumentInputError } from '@/lib/document-parser';
import { DOCUMENT_BUCKET, DocumentConfigurationError, getDocumentClient, getPrivateDocumentSummaries, savePrivateDocument } from '@/lib/documents-service';
import { documentError, documentUnauthorized, PRIVATE_HEADERS, readDocumentForm } from '@/lib/document-http';
import { MAX_DOCUMENT_SIZE } from '@/lib/document-types';
import type { DocumentAsset } from '@/lib/document-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  try {
    return NextResponse.json({ success: true, data: await getPrivateDocumentSummaries() }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return documentError(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return documentUnauthorized();
  const uploaded: string[] = [];
  try {
    const file = (await readDocumentForm(request)).get('file');
    if (!(file instanceof File)) throw new DocumentInputError('未找到文档文件。');
    if (!file.size || file.size > MAX_DOCUMENT_SIZE) throw new DocumentInputError('文档不能为空且不能超过 10MB。');
    const id = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocument(file.name, buffer, id);
    const client = getDocumentClient();
    const { data: bucket, error: bucketError } = await client.storage.getBucket(DOCUMENT_BUCKET);
    if (bucketError || !bucket || bucket.public) throw new DocumentConfigurationError('私人文档存储尚未配置，请初始化私有文档存储。');
    const storage = client.storage.from(DOCUMENT_BUCKET);
    const originalKey = `${id}/original.${parsed.format}`;
    const contentTypes = { md: 'text/markdown', txt: 'text/plain', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    const { error: originalError } = await storage.upload(originalKey, buffer, { contentType: contentTypes[parsed.format], upsert: false });
    if (originalError) throw originalError;
    uploaded.push(originalKey);
    const assets: DocumentAsset[] = [];
    for (const image of parsed.images) {
      const key = `${id}/images/${image.id}`;
      const { error } = await storage.upload(key, image.buffer, { contentType: image.contentType, upsert: false });
      if (error) throw error;
      uploaded.push(key);
      assets.push({ id: image.id, key, contentType: image.contentType });
    }
    const document = await savePrivateDocument({
      id, title: parsed.title, excerpt: parsed.excerpt, content: parsed.content,
      format: parsed.format, original_name: file.name, original_key: originalKey, assets,
    });
    revalidatePath('/');
    return NextResponse.json({ success: true, data: document, warnings: parsed.warnings }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) {
    if (uploaded.length) {
      try {
        const { error: cleanupError } = await getDocumentClient().storage.from(DOCUMENT_BUCKET).remove(uploaded);
        if (cleanupError) console.error('上传失败后的文件清理失败:', cleanupError.message);
      } catch (cleanupError) {
        console.error('上传失败后的文件清理失败:', cleanupError);
      }
    }
    return documentError(error);
  }
}
