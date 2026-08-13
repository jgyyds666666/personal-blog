import { NextResponse } from 'next/server';
import { checkPostsDataSource } from '@/lib/posts-service';
import { getSupabaseConfiguration } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configuration = getSupabaseConfiguration();
  if (!configuration.configured) {
    return NextResponse.json(
      { ok: false, status: 'configuration', message: '文章服务尚未配置。' },
      { status: 503 }
    );
  }

  try {
    await checkPostsDataSource();
    return NextResponse.json({ ok: true, status: 'ready' });
  } catch (error) {
    console.error('文章服务健康检查失败:', error);
    return NextResponse.json(
      { ok: false, status: 'database', message: '文章服务暂时不可用。' },
      { status: 503 }
    );
  }
}
