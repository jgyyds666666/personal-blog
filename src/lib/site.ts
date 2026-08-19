export const SITE_NAME = '墨香博客';
export const SITE_DESCRIPTION = '记录技术、读书与生活的点滴思考。';
export const SITE_AUTHOR = '墨香';

function getSiteUrl() {
  const configuredUrl = process.env.BLOG_SITE_URL?.trim();
  if (!configuredUrl) return 'http://localhost:3000';

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export const SITE_URL = getSiteUrl();

export function absoluteUrl(path = '/') {
  return new URL(path, `${SITE_URL}/`).toString();
}
