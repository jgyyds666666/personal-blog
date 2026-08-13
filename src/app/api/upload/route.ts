import { NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { isAdminAuthenticated } from '@/lib/admin-auth';

const storage = new S3Storage({ region: 'cn-beijing' });
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, error: '登录已失效，请重新登录。' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: '未找到图片文件。' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: '仅支持上传图片文件。' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: '图片大小不能超过 5MB。' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `blog-images/${Date.now()}_${safeName}`;
    const fileKey = await storage.uploadFile({
      fileContent: Buffer.from(await file.arrayBuffer()),
      fileName,
      contentType: file.type,
    });
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ success: true, data: { key: fileKey, url } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '图片上传失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
