import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'personal_blog_admin_session';

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
const SESSION_PREFIX = 'personal-blog-admin';

export class AdminAuthConfigurationError extends Error {
  constructor() {
    super('后台登录尚未配置。请在环境变量中设置 BLOG_ADMIN_PASSWORD 和 BLOG_AUTH_SECRET。');
    this.name = 'AdminAuthConfigurationError';
  }
}

interface AdminAuthConfiguration {
  password: string;
  secret: string;
}

function getAdminAuthConfiguration(): AdminAuthConfiguration {
  const password = process.env.BLOG_ADMIN_PASSWORD?.trim();
  const secret = process.env.BLOG_AUTH_SECRET?.trim();

  if (!password || !secret) {
    throw new AdminAuthConfigurationError();
  }

  return { password, secret };
}

function secureEquals(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function signSession(timestamp: number, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${SESSION_PREFIX}:${timestamp}`)
    .digest('hex');
}

export function verifyAdminPassword(password: string): boolean {
  return secureEquals(password, getAdminAuthConfiguration().password);
}

export function createAdminSession(): string {
  const timestamp = Date.now();
  const { secret } = getAdminAuthConfiguration();

  return `${timestamp}.${signSession(timestamp, secret)}`;
}

export function getSessionMaxAge(): number {
  return SESSION_DURATION_SECONDS;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    if (!session) {
      return false;
    }

    const [timestampValue, signature, ...extraValues] = session.split('.');
    const timestamp = Number(timestampValue);
    const now = Date.now();

    if (
      extraValues.length > 0 ||
      !Number.isSafeInteger(timestamp) ||
      !signature ||
      timestamp > now ||
      now - timestamp > SESSION_DURATION_SECONDS * 1000
    ) {
      return false;
    }

    return secureEquals(signature, signSession(timestamp, getAdminAuthConfiguration().secret));
  } catch {
    return false;
  }
}
