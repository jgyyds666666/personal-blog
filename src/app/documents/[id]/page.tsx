import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getPrivateDocument } from '@/lib/documents-service';
import { renderMarkdown } from '@/lib/markdown';
import { MarkdownContent } from '@/components/markdown-content';
import { ReadingProgress, TableOfContents } from '@/components/reading-tools';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '私人文档', robots: { index: false, follow: false } };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminAuthenticated())) redirect(`/login?next=${encodeURIComponent(`/documents/${id}`)}`);
  const document = await getPrivateDocument(id);
  if (!document) notFound();
  const parsed = document.format === 'txt' ? null : renderMarkdown(document.content, { includeTopLevelHeadings: true });
  return (
    <>
      <ReadingProgress />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12 lg:py-14">
        <article className="min-w-0">
          <Link href="/" className="mb-8 inline-block text-sm text-[#6b7280] hover:text-[#b45309]">← 返回首页</Link>
          <header className="mb-10">
            <div className="mb-4 flex items-center gap-3 text-sm text-[#78716c]"><LockKeyhole className="size-4" /><span>私人文档 · 仅自己可见</span><span className="uppercase">{document.format}</span></div>
            <h1 className="mb-4 break-words font-serif text-3xl font-bold leading-tight text-[#2c2c2c] md:text-4xl">{document.title}</h1>
            <Button asChild variant="outline" size="sm"><a href={`/api/documents/${document.id}/download`}>下载原文件</a></Button>
          </header>
          {parsed && <TableOfContents headings={parsed.headings} variant="mobile" />}
          {parsed ? <MarkdownContent html={parsed.html} /> : <div data-reading-content className="post-content whitespace-pre-wrap break-words">{document.content}</div>}
        </article>
        {parsed && <TableOfContents headings={parsed.headings} />}
      </div>
    </>
  );
}
