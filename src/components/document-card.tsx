import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DocumentActions } from '@/components/document-actions';
import type { PrivateDocumentSummary } from '@/lib/document-types';

export function DocumentCard({ document }: { document: PrivateDocumentSummary }) {
  return (
    <article className="border-b border-[#e7e2d8] py-6 last:border-b-0">
      <Link href={`/documents/${document.id}`} prefetch={false} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#b45309]/40">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <time dateTime={document.created_at} className="text-xs text-[#6b7280]">{new Date(document.created_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' })}</time>
          <Badge variant="outline" className="gap-1 border-[#e7e2d8] text-[#78716c]"><LockKeyhole className="size-3" />私有</Badge>
          <span className="text-xs uppercase text-[#9ca3af]">{document.format}</span>
        </div>
        <h2 className="break-words font-serif text-xl font-semibold leading-snug text-[#2c2c2c] group-hover:text-[#b45309]">{document.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#4b5563]">{document.excerpt || '点击阅读文档'}</p>
      </Link>
      <DocumentActions id={document.id} title={document.title} />
    </article>
  );
}
