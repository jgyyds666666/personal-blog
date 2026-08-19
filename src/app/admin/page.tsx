'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Trash2, Edit3, ArrowLeft } from 'lucide-react';
import { redirectIfAdminSessionExpired } from '@/lib/admin-client';

interface PostItem {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    void fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const response = await fetch('/api/posts?all=true');
      if (redirectIfAdminSessionExpired(response)) return;
      const result: { success?: boolean; data?: PostItem[] } =
        await response.json();
      if (result.success) setPosts(result.data ?? []);
      else setMessage('文章加载失败，请稍后重试。');
    } catch {
      setMessage('文章加载失败，请检查网络连接。');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(post: PostItem) {
    if (!window.confirm(`确定删除《${post.title}》吗？此操作无法撤销。`))
      return;
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      if (redirectIfAdminSessionExpired(response)) return;
      const result: { success?: boolean; error?: string } =
        await response.json();
      if (!result.success) throw new Error(result.error || '删除失败');
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setMessage('文章已删除。');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '删除失败，请稍后重试。'
      );
    }
  }

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          (!query.trim() ||
            `${post.title} ${post.slug}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())) &&
          (status === 'all' || post.status === status)
      ),
    [posts, query, status]
  );

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* 顶部标题区 */}
      <div className="border-b border-[#e7e2d8] bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#b45309]">
                <FileText className="size-4" />
                <span>内容管理</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-serif font-bold text-[#2c2c2c] md:text-3xl">
                我的文章
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                共 {posts.length} 篇 · 已发布 {publishedCount} · 草稿 {draftCount}
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/new')}
              className="h-10 gap-1.5 bg-[#b45309] px-4 text-white hover:bg-[#92400e]"
            >
              <Plus className="size-4" />
              <span>新建文章</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* 搜索筛选区 */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#e7e2d8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题或文章地址"
              aria-label="搜索文章"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  status === s
                    ? 'bg-[#2c2c2c] text-white shadow-sm'
                    : 'bg-[#faf8f5] text-[#6b7280] hover:bg-[#f3efe7] hover:text-[#2c2c2c]'
                }`}
              >
                {s === 'all'
                  ? '全部'
                  : s === 'published'
                  ? `已发布 ${publishedCount}`
                  : `草稿 ${draftCount}`}
              </button>
            ))}
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className="mb-5 rounded-lg border border-[#e7e2d8] bg-[#faf8f5] px-4 py-3 text-sm text-[#57534e]">
            {message}
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="rounded-xl border border-dashed border-[#d6d3cb] bg-white py-16 text-center text-sm text-[#78716c]">
            正在加载文章…
          </div>
        )}

        {/* 空状态 */}
        {!loading && filteredPosts.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#d6d3cb] bg-white py-20 text-center">
            <FileText className="mx-auto mb-3 size-10 text-[#d6d3cb]" />
            <p className="text-sm text-[#78716c]">没有匹配的文章</p>
            <Button
              onClick={() => router.push('/admin/new')}
              className="mt-4 bg-[#b45309] text-white hover:bg-[#92400e]"
            >
              写第一篇文章
            </Button>
          </div>
        )}

        {/* 文章列表 */}
        {!loading && filteredPosts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#e7e2d8] bg-white shadow-sm">
            {/* 列表头 */}
            <div className="flex items-center gap-3 border-b border-[#e7e2d8] bg-[#faf8f5] px-5 py-3 text-xs font-medium text-[#78716c]">
              <div className="flex-1">文章标题</div>
              <div className="hidden w-20 shrink-0 text-center sm:block">
                状态
              </div>
              <div className="hidden w-28 shrink-0 text-right sm:block">
                更新时间
              </div>
              <div className="w-24 shrink-0 text-right">操作</div>
            </div>

            {/* 列表项 */}
            <div className="divide-y divide-[#e7e2d8]">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#faf8f5]"
                >
                  {/* 标题 */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="block truncate font-medium text-[#2c2c2c] transition-colors hover:text-[#b45309]"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                      /{post.slug}
                    </p>
                  </div>

                  {/* 状态 - sm 以上显示 */}
                  <div className="hidden w-20 shrink-0 text-center sm:block">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-[#f3efe7] text-[#78716c]'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-500'
                            : 'bg-[#a8a29e]'
                        }`}
                      />
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>

                  {/* 更新时间 - sm 以上显示 */}
                  <div className="hidden w-28 shrink-0 text-right text-xs text-[#9ca3af] sm:block">
                    {formatDate(post.updated_at)}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex w-24 shrink-0 items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#6b7280] hover:bg-[#e7e2d8] hover:text-[#b45309]"
                      onClick={() => router.push(`/admin/edit/${post.id}`)}
                      title="编辑"
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#9ca3af] hover:bg-red-50 hover:text-red-600"
                      onClick={() => void handleDelete(post)}
                      title="删除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 返回链接 */}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-[#6b7280] transition-colors hover:text-[#b45309]"
        >
          <ArrowLeft className="size-4" />
          返回博客首页
        </Link>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes} 分钟前`;
    }
    return `${hours} 小时前`;
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
