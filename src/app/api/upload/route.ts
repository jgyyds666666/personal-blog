import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { S3Storage } from 'coze-coding-dev-sdk';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createBlogImageUrl } from '@/lib/blog-images';

const storage = new S3Storage({ region: 'cn-beijing' });
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/avif': { extension: 'avif', matches: isAvif },
  'image/gif': { extension: 'gif', matches: isGif },
  'image/jpeg': { extension: 'jpg', matches: isJpeg },
  'image/png': { extension: 'png', matches: isPng },
  'image/webp': { extension: 'webp', matches: isWebp },
} as const;

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

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: '图片不能为空且不能超过 5MB。' }, { status: 400 });
    }

    const imageType = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
    const fileContent = Buffer.from(await file.arrayBuffer());
    if (!imageType || !imageType.matches(fileContent)) {
      return NextResponse.json(
        { success: false, error: '仅支持有效的 JPEG、PNG、WebP、GIF 或 AVIF 图片。' },
        { status: 400 }
      );
    }

    const safeBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'image';
    const fileName = `blog-images/${randomUUID()}_${safeBaseName}.${imageType.extension}`;
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type,
    });
    const url = createBlogImageUrl(fileKey);
    if (!url) {
      throw new Error('图片存储地址无效。');
    }

    return NextResponse.json({ success: true, data: { key: fileKey, url } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '图片上传失败，请稍后重试。' },
      { status: 500 }
    );
  }
}

function isJpeg(content: Buffer): boolean {
  return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
}

function isPng(content: Buffer): boolean {
  return content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isGif(content: Buffer): boolean {
  const signature = content.subarray(0, 6).toString('ascii');
  return signature === 'GIF87a' || signature === 'GIF89a';
}

function isWebp(content: Buffer): boolean {
  return content.length >= 12
    && content.subarray(0, 4).toString('ascii') === 'RIFF'
    && content.subarray(8, 12).toString('ascii') === 'WEBP';
}

function isAvif(content: Buffer): boolean {
  if (content.length < 12 || content.subarray(4, 8).toString('ascii') !== 'ftyp') return false;
  const brand = content.subarray(8, 12).toString('ascii');
  return brand === 'avif' || brand === 'avis';
}
