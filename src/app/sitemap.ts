import type { MetadataRoute } from 'next';
import { getCachedPublishedPostSummaries } from '@/lib/public-posts';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getCachedPublishedPostSummaries().catch(() => []);

  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/about'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${encodeURIComponent(post.slug)}`),
      lastModified: post.updated_at || post.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
