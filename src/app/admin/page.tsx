'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PostItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts?all=true');
      const result = await res.json();
      if (result.success) {
        setPosts(result.data);
      }
    } catch (err) {
      console.error('获取文章列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        setPosts(posts.filter((p) => p.id !== id));
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (err) {
      alert(`删除失败: ${(err as Error).message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2c2c2c]">
            文章管理
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            共 {posts.length} 篇文章
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/new')}
          className="bg-[#b45309] hover:bg-[#92400e] text-white"
        >
          新建文章
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7280]">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6b7280] mb-4">还没有文章</p>
          <Button
            onClick={() => router.push('/admin/new')}
            className="bg-[#b45309] hover:bg-[#92400e] text-white"
          >
            写第一篇文章
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#e7e2d8] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#faf8f5] border-b border-[#e7e2d8]">
                <th className="text-left px-4 py-3 text-sm font-medium text-[#4b5563]">
                  标题
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#4b5563] w-24">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#4b5563] w-44">
                  更新时间
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#4b5563] w-32">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[#e7e2d8] last:border-b-0 hover:bg-[#faf8f5]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="text-[#2c2c2c] hover:text-[#b45309] font-medium"
                    >
                      {post.title}
                    </Link>
                    <div className="text-xs text-[#9ca3af] mt-0.5">
                      /{post.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-[#f3efe7] text-[#78716c]'
                      }`}
                    >
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => router.push(`/admin/edit/${post.id}`)}
                      className="text-sm text-[#b45309] hover:text-[#92400e] mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm text-[#6b7280] hover:text-[#b45309] transition-colors"
        >
          ← 返回博客首页
        </Link>
      </div>
    </div>
  );
}
