import { NextResponse } from 'next/server';
import {
  getPublishedPosts,
  createPost,
  getAllPosts,
} from '@/lib/posts-service';

// GET /api/posts - 获取文章列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const posts = all ? await getAllPosts() : await getPublishedPosts();

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/posts - 创建新文章
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.slug || !body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'slug、title 和 content 为必填字段' },
        { status: 400 }
      );
    }

    const post = await createPost(body);

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
