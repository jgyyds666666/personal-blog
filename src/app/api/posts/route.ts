import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  createPost,
  getAllPosts,
  getPostBySlugAnyStatus,
  getPublishedPostSummaries,
} from '@/lib/posts-service';
import { PUBLISHED_POSTS_CACHE_TAG } from '@/lib/public-posts';
import { validatePostInput } from '@/lib/post-validation';

function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: '登录已失效，请重新登录。' }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const all = new URL(request.url).searchParams.get('all') === 'true';

    if (all && !(await isAdminAuthenticated())) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      success: true,
      data: all ? await getAllPosts() : await getPublishedPostSummaries(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '文章加载失败。' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const validation = validatePostInput(await request.json());
    if (!validation.data) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    if (await getPostBySlugAnyStatus(validation.data.slug)) {
      return NextResponse.json({ success: false, error: '这个文章地址已经存在，请换一个。' }, { status: 409 });
    }

    const post = await createPost(validation.data);
    if (post.status === 'published') {
      revalidatePath('/');
      revalidatePath(`/posts/${post.slug}`);
      revalidateTag(PUBLISHED_POSTS_CACHE_TAG, 'max');
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '保存失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
