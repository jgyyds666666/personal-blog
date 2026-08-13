import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Post } from '@/storage/database/shared/schema';

export interface PostWithUrl extends Omit<Post, 'cover_image_key'> {
  cover_image_url?: string;
}

/**
 * 获取所有已发布的文章（按创建时间倒序）
 */
export async function getPublishedPosts(): Promise<PostWithUrl[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取文章列表失败: ${error.message}`);
  }

  return data as PostWithUrl[];
}

/**
 * 获取所有文章（含草稿，用于后台管理）
 */
export async function getAllPosts(): Promise<PostWithUrl[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取文章列表失败: ${error.message}`);
  }

  return data as PostWithUrl[];
}

/**
 * 根据 slug 获取文章
 */
export async function getPostBySlug(slug: string): Promise<PostWithUrl | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`获取文章失败: ${error.message}`);
  }

  return data as PostWithUrl;
}

/**
 * 根据 ID 获取文章
 */
export async function getPostById(id: string): Promise<PostWithUrl | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`获取文章失败: ${error.message}`);
  }

  return data as PostWithUrl;
}

export interface CreatePostData {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  tags?: string[];
  status?: 'draft' | 'published';
  cover_image_key?: string;
}

/**
 * 创建新文章
 */
export async function createPost(postData: CreatePostData): Promise<PostWithUrl> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .insert({
      slug: postData.slug,
      title: postData.title,
      excerpt: postData.excerpt || '',
      content: postData.content,
      tags: postData.tags || [],
      status: postData.status || 'draft',
      cover_image_key: postData.cover_image_key || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`创建文章失败: ${error.message}`);
  }

  return data as PostWithUrl;
}

export interface UpdatePostData {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  cover_image_key?: string | null;
}

/**
 * 更新文章
 */
export async function updatePost(
  id: string,
  postData: UpdatePostData
): Promise<PostWithUrl> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .update({
      ...postData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`更新文章失败: ${error.message}`);
  }

  return data as PostWithUrl;
}

/**
 * 删除文章
 */
export async function deletePost(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('posts').delete().eq('id', id);

  if (error) {
    throw new Error(`删除文章失败: ${error.message}`);
  }
}
