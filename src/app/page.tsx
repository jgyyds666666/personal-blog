import { getPublishedPosts } from '@/lib/posts-service';
import { PostCard } from '@/components/post-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '首页',
  description: '墨香博客 - 记录技术、读书与生活的点滴思考',
};

// 重新验证时间（秒），让页面定期刷新内容
export const revalidate = 60;

export default async function HomePage() {
  let posts: any[] = [];
  let error: string | null = null;

  try {
    posts = await getPublishedPosts();
  } catch (e) {
    error = (e as Error).message;
    console.error('获取文章失败:', e);
  }

  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || []))
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2c2c2c] mb-4 leading-tight">
          墨香
        </h1>
        <p className="text-[#6b7280] text-lg max-w-lg mx-auto leading-relaxed">
          在这里，记录代码、书本与生活
          <br />
          慢慢写，慢慢读，慢慢思考
        </p>
      </section>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <section className="mb-8 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-[#6b7280] mr-2 self-center">标签：</span>
          {allTags.map((tag) => (
            <span
              key={tag}
              className="text-sm px-3 py-1 rounded-full bg-[#f3efe7] text-[#78716c] hover:bg-[#b45309] hover:text-white cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </section>
      )}

      {/* 文章列表 */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-[#2c2c2c] mb-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#b45309] rounded-full" />
          最新文章
        </h2>
        <div className="mt-4">
          {error ? (
            <div className="text-center py-12 text-[#6b7280]">
              加载文章失败，请稍后重试
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280]">
              还没有文章，敬请期待
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </section>
    </div>
  );
}
