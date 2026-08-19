import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deletePost, getPostById, getPostBySlugAnyStatus, updatePost } from '@/lib/posts-service';
import { PUBLISHED_POSTS_CACHE_TAG } from '@/lib/public-posts';
import { validatePostInput } from '@/lib/post-validation';

type RouteContext = { params: Promise<{ id: string }> };

function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: '登录已失效，请重新登录。' }, { status: 401 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const post = await getPostById((await params).id);
    return post
      ? NextResponse.json({ success: true, data: post })
      : NextResponse.json({ success: false, error: '文章不存在。' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '文章加载失败。' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const id = (await params).id;
    const existing = await getPostById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: '文章不存在。' }, { status: 404 });
    }

    const validation = validatePostInput(await request.json());
    if (!validation.data) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const duplicate = await getPostBySlugAnyStatus(validation.data.slug);
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ success: false, error: '这个文章地址已经存在，请换一个。' }, { status: 409 });
    }

    const post = await updatePost(id, validation.data);
    revalidatePath('/');
    revalidatePath(`/posts/${existing.slug}`);
    revalidatePath(`/posts/${post.slug}`);
    revalidateTag(PUBLISHED_POSTS_CACHE_TAG, 'max');

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '保存失败，请稍后重试。' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const id = (await params).id;
    const existing = await getPostById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: '文章不存在。' }, { status: 404 });
    }

    await deletePost(id);
    revalidatePath('/');
    revalidatePath(`/posts/${existing.slug}`);
    revalidateTag(PUBLISHED_POSTS_CACHE_TAG, 'max');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
