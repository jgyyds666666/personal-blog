import { unstable_cache } from 'next/cache';
import { getPublishedPostSummaries } from '@/lib/posts-service';

export const PUBLISHED_POSTS_CACHE_TAG = 'published-posts';

export const getCachedPublishedPostSummaries = unstable_cache(
  getPublishedPostSummaries,
  ['published-post-summaries'],
  { revalidate: 300, tags: [PUBLISHED_POSTS_CACHE_TAG] }
);
