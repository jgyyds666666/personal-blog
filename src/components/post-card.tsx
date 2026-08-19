import Link from 'next/link';
import type { PostSummary } from '@/lib/posts-service';

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group border-b border-[#e7e2d8] py-6 last:border-b-0">
      <Link href={`/posts/${post.slug}`} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#b45309]/40">
        <div className="flex flex-col gap-2">
          <time dateTime={post.created_at} className="text-xs text-[#6b7280]">{new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
          <h2 className="text-xl font-serif font-semibold leading-snug text-[#2c2c2c] transition-colors group-hover:text-[#b45309]">{post.title}</h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#4b5563]">{post.excerpt || '暂无摘要'}</p>
          {post.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f3efe7] px-2 py-0.5 text-xs text-[#78716c]">#{tag}</span>)}</div>}
        </div>
      </Link>
    </article>
  );
}
