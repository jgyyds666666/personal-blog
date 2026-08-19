'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('页面加载失败:', error); }, [error]);
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-[#2c2c2c]">页面暂时无法加载</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">可能是网络或服务暂时不可用，请稍后重试。</p>
      <Button type="button" onClick={reset} className="mt-6 bg-[#b45309] text-white hover:bg-[#92400e]">重新加载</Button>
    </div>
  );
}
