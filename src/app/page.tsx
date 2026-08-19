import type { Metadata } from 'next';
import type { PostSummary } from '@/lib/posts-service';
import { getCachedPublishedPostSummaries } from '@/lib/public-posts';
import { SupabaseConfigurationError } from '@/storage/database/supabase-client';
import { HomeDataError } from '@/components/home-data-error';
import { PostBrowser } from '@/components/post-browser';
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: '首页',
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    title: `首页 | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
};

export const revalidate = 300;

export default async function HomePage() {
  let posts: PostSummary[] = [];
  let errorKind: 'configuration' | 'database' | null = null;

  try {
    posts = await getCachedPublishedPostSummaries();
  } catch (error) {
    errorKind = error instanceof SupabaseConfigurationError ? 'configuration' : 'database';
    console.error('首页获取文章失败:', error);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <section className="py-12 text-center md:py-20">
        <p className="mb-3 text-sm font-medium tracking-[0.25em] text-[#b45309]">PERSONAL NOTES</p>
        <h1 className="mb-4 text-4xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-5xl">墨香</h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-[#6b7280]">记录代码、书本与生活<br />慢慢写，慢慢读，慢慢思考</p>
      </section>
      {errorKind ? <HomeDataError kind={errorKind} /> : <PostBrowser posts={posts} />}
    </div>
  );
}
