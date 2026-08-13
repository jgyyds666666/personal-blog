export type PostStatus = 'draft' | 'published';
export interface ValidatedPostInput { title: string; slug: string; excerpt: string; content: string; tags: string[]; status: PostStatus; }
export function normalizeSlug(value: string): string { return value.trim().toLowerCase().replace(/\s+/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }
export function validatePostInput(value: unknown): { data?: ValidatedPostInput; error?: string } {
  if (!value || typeof value !== 'object') return { error: '请求数据格式不正确。' };
  const input = value as Record<string, unknown>;
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const slug = typeof input.slug === 'string' ? normalizeSlug(input.slug) : '';
  const excerpt = typeof input.excerpt === 'string' ? input.excerpt.trim() : '';
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  const tags = Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : [];
  const status: PostStatus = input.status === 'published' ? 'published' : 'draft';
  if (!title) return { error: '请输入文章标题。' };
  if (!slug) return { error: '请输入文章地址。' };
  if (slug.length > 128) return { error: '文章地址不能超过 128 个字符。' };
  if (!/^[\p{L}\p{N}_-]+$/u.test(slug)) return { error: '文章地址只能包含中文、英文、数字、短横线和下划线。' };
  if (!content) return { error: '请输入文章正文。' };
  if (excerpt.length > 500) return { error: '摘要不能超过 500 个字符。' };
  return { data: { title, slug, excerpt, content, tags, status } };
}
