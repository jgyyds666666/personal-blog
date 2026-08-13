import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    created_at: string;
    tags?: string[] | null;
    content?: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const readingTime = calculateReadingTime(post.content || '');

  return (
    <article className="group py-6 border-b border-[#e7e2d8] last:border-b-0">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-xs text-[#6b7280]">
            <time dateTime={post.created_at}>
              {formatDate(post.created_at)}
            </time>
            <span className="text-[#d6d3cb]">·</span>
            <span>{readingTime} 分钟阅读</span>
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#2c2c2c] group-hover:text-[#b45309] transition-colors leading-snug">
            {post.title}
          </h2>
          <p className="text-[#4b5563] text-sm leading-relaxed line-clamp-2">
            {post.excerpt || '暂无摘要'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {(post.tags || []).map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[#f3efe7] text-[#78716c] hover:bg-[#e7e2d8] transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateReadingTime(content: string): number {
  const chars = content.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(chars / 400));
}
