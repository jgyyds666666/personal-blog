const BLOG_IMAGE_KEY_PREFIX = 'blog-images/';
const BLOG_IMAGE_ROUTE_PREFIX = '/media/';

function normalizeFileKey(value: string): string | null {
  const key = value.replace(/^\/+/, '');
  const segments = key.split('/');

  if (
    !key.startsWith(BLOG_IMAGE_KEY_PREFIX) ||
    key.length > 512 ||
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    return null;
  }

  return key;
}

export function getBlogImageKey(segments: string[]): string | null {
  return normalizeFileKey(segments.join('/'));
}

export function createBlogImageUrl(fileKey: string): string | null {
  const key = normalizeFileKey(fileKey);
  if (!key) {
    return null;
  }

  return `${BLOG_IMAGE_ROUTE_PREFIX}${key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}

/**
 * 将历史文章中的 OSS 签名地址转换为站内稳定地址。
 * 只处理博客上传目录，外部图片地址保持不变。
 */
export function normalizeBlogImageUrl(value: string): string {
  const originalUrl = value.trim();
  if (!originalUrl) {
    return value;
  }

  let pathname: string;
  try {
    pathname = new URL(originalUrl, 'https://personal-blog.local').pathname;
  } catch {
    return value;
  }

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return value;
  }

  if (decodedPathname.startsWith(BLOG_IMAGE_ROUTE_PREFIX)) {
    return createBlogImageUrl(decodedPathname.slice(BLOG_IMAGE_ROUTE_PREFIX.length)) ?? value;
  }

  const marker = `/${BLOG_IMAGE_KEY_PREFIX}`;
  const markerIndex = decodedPathname.indexOf(marker);
  if (markerIndex < 0) {
    return value;
  }

  return createBlogImageUrl(decodedPathname.slice(markerIndex + 1)) ?? value;
}
