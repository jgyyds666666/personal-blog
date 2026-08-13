'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HomeDataError({ kind }: { kind: 'configuration' | 'database' }) {
  const router = useRouter();
  const description = kind === 'configuration'
    ? '文章服务正在配置中，请稍后再试。'
    : '暂时无法连接文章服务，请稍后再试。';

  return (
    <section className="rounded-xl border border-[#e7e2d8] bg-white/70 px-6 py-14 text-center">
      <p className="font-serif text-lg font-semibold text-[#2c2c2c]">文章暂时无法加载</p>
      <p className="mt-2 text-sm text-[#6b7280]">{description}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#d6d3cb] px-4 py-2 text-sm text-[#57534e] transition-colors hover:border-[#b45309] hover:text-[#b45309]"
      >
        <RefreshCw className="size-4" />
        重新加载
      </button>
    </section>
  );
}
