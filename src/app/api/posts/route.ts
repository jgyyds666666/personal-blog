import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPublishedPosts, createPost, getAllPosts, getPostBySlugAnyStatus } from '@/lib/posts-service';
import { validatePostInput } from '@/lib/post-validation';

export async function GET(request: Request) { try { const all = new URL(request.url).searchParams.get('all') === 'true'; return NextResponse.json({ success: true, data: all ? await getAllPosts() : await getPublishedPosts() }); } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '文章加载失败。' }, { status: 500 }); } }
export async function POST(request: Request) { try { const validation = validatePostInput(await request.json()); if (!validation.data) return NextResponse.json({ success: false, error: validation.error }, { status: 400 }); if (await getPostBySlugAnyStatus(validation.data.slug)) return NextResponse.json({ success: false, error: '这个文章地址已经存在，请换一个。' }, { status: 409 }); const post = await createPost(validation.data); if (post.status === 'published') { revalidatePath('/'); revalidatePath(`/posts/${post.slug}`); } return NextResponse.json({ success: true, data: post }, { status: 201 }); } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '保存失败，请稍后重试。' }, { status: 500 }); } }
