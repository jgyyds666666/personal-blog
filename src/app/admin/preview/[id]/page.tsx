import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/markdown-content';
import { getPostById } from '@/lib/posts-service';
import { renderMarkdown } from '@/lib/markdown';

export const metadata: Metadata = {
  title: '预览文章',
  robots: { index: false, follow: false },
};

export default async function AdminPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  const parsed = renderMarkdown(post.content);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span>后台预览 · {post.status === 'published' ? '已发布' : '草稿'}</span>
        <Link href={`/admin/edit/${post.id}`} className="font-medium text-[#b45309] hover:underline">返回编辑</Link>
      </div>
      <article>
        <header className="mb-10">
          <h1 className="text-3xl font-serif font-bold leading-tight text-[#2c2c2c] md:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-base leading-relaxed text-[#6b7280]">{post.excerpt}</p>}
          <div className="mt-5 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f3efe7] px-2.5 py-1 text-xs text-[#78716c]">#{tag}</span>)}</div>
        </header>
        <MarkdownContent html={parsed.html} />
      </article>
    </div>
  );
}
