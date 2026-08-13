import { NextResponse } from 'next/server';
import { updatePost, deletePost, getPostById } from '@/lib/posts-service';

// GET /api/posts/[id] - 获取单篇文章
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - 更新文章
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const post = await updatePost(id, body);

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 删除文章
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
