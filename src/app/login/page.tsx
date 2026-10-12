import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { AdminLoginForm } from '@/components/admin-login-form';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const requestedNext = (await searchParams).next;
  const nextPath = typeof requestedNext === 'string' && (requestedNext === '/' || /^\/admin(?:\/[^\\]*)?$/.test(requestedNext) || /^\/documents\/[\da-f-]{36}$/i.test(requestedNext))
    ? requestedNext
    : '/admin';
  if (await isAdminAuthenticated()) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-[#e7e2d8] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-[#f3efe7] text-[#b45309]">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2c2c2c]">内容管理登录</h1>
          <p className="mt-2 text-sm text-[#78716c]">登录后可管理文章、上传和阅读私人文档</p>
        </div>
        <AdminLoginForm nextPath={nextPath} />
        <Link href="/" className="mt-6 block text-center text-sm text-[#78716c] hover:text-[#b45309]">
          返回博客首页
        </Link>
      </section>
    </main>
  );
}
