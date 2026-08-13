'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');

    if (typeof password !== 'string' || !password) {
      setMessage('请输入后台密码。');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result: { success?: boolean; error?: string } = await response.json();

      if (!result.success) {
        throw new Error(result.error || '登录失败，请稍后重试。');
      }

      router.replace('/admin');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-[#4b5563]" htmlFor="admin-password">
        后台密码
      </label>
      <Input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        className="h-11"
        placeholder="输入后台密码"
        disabled={submitting}
      />
      {message && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {message}
        </p>
      )}
      <Button type="submit" className="h-11 w-full bg-[#b45309] text-white hover:bg-[#92400e]" disabled={submitting}>
        {submitting ? '正在验证…' : '进入后台'}
      </Button>
    </form>
  );
}
