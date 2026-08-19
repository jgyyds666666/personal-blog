import { NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getBlogImageKey } from '@/lib/blog-images';

const storage = new S3Storage({ region: 'cn-beijing' });
const SIGNED_URL_LIFETIME_SECONDS = 24 * 60 * 60;

type RouteContext = {
  params: Promise<{ key: string[] }>;
};

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: RouteContext) {
  const fileKey = getBlogImageKey((await params).key);
  if (!fileKey) {
    return NextResponse.json({ error: '图片地址无效。' }, { status: 404 });
  }

  try {
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: SIGNED_URL_LIFETIME_SECONDS,
    });
    const response = NextResponse.redirect(signedUrl, 307);

    response.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    );
    return response;
  } catch (error) {
    console.error('生成图片访问地址失败:', error);
    return NextResponse.json({ error: '图片暂时无法加载。' }, { status: 502 });
  }
}
