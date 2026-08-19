import { getCachedPublishedPostSummaries } from '@/lib/public-posts';
import { absoluteUrl, SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET() {
  const posts = await getCachedPublishedPostSummaries().catch(() => []);
  const latestDate = posts[0]?.updated_at || posts[0]?.created_at || new Date().toISOString();
  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/posts/${encodeURIComponent(post.slug)}`);
      const description = post.excerpt || `${post.title} - ${SITE_NAME}`;
      return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(description)}</description><pubDate>${new Date(post.created_at).toUTCString()}</pubDate><author>${escapeXml(SITE_AUTHOR)}</author></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(SITE_NAME)}</title><link>${escapeXml(absoluteUrl('/'))}</link><description>${escapeXml(SITE_DESCRIPTION)}</description><language>zh-CN</language><lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
