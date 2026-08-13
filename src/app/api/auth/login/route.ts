import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  AdminAuthConfigurationError,
  createAdminSession,
  getSessionMaxAge,
  verifyAdminPassword,
} from '@/lib/admin-auth';

interface LoginPayload {
  password?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;

    if (typeof payload.password !== 'string' || !payload.password) {
      return NextResponse.json({ success: false, error: '请输入后台密码。' }, { status: 400 });
    }

    if (!verifyAdminPassword(payload.password)) {
      return NextResponse.json({ success: false, error: '后台密码不正确。' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSession(),
      httpOnly: true,
      maxAge: getSessionMaxAge(),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    const status = error instanceof AdminAuthConfigurationError ? 503 : 400;
    const message =
      error instanceof AdminAuthConfigurationError
        ? error.message
        : '登录请求无效，请稍后重试。';

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
