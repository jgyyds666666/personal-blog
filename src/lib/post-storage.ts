import type { Post } from '@/data/posts';

export const POSTS_STORAGE_KEY = 'personal-blog-posts';

export function readStoredPosts(): Post[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(POSTS_STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPost);
  } catch {
    return [];
  }
}

export function writeStoredPosts(posts: Post[]): void {
  window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event('posts-updated'));
}

function isPost(value: unknown): value is Post {
  if (!value || typeof value !== 'object') return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.excerpt === 'string' &&
    typeof post.date === 'string' &&
    Array.isArray(post.tags) &&
    post.tags.every((tag) => typeof tag === 'string') &&
    typeof post.readingTime === 'string' &&
    typeof post.content === 'string'
  );
}

export function mergePosts(defaultPosts: Post[], storedPosts: Post[]): Post[] {
  const bySlug = new Map(defaultPosts.map((post) => [post.slug, post]));
  storedPosts.forEach((post) => bySlug.set(post.slug, post));
  return Array.from(bySlug.values()).sort((a, b) => b.date.localeCompare(a.date));
}
