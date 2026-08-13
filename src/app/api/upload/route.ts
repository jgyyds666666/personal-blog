import { NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  region: 'cn-beijing',
});

// POST /api/upload - 上传图片到 OSS
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 校验文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '仅支持上传图片文件' },
        { status: 400 }
      );
    }

    // 校验文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 生成安全的文件名
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `blog-images/${timestamp}_${safeName}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 OSS
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    });

    // 生成签名 URL（7天有效期）
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      data: {
        key: fileKey,
        url,
      },
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
