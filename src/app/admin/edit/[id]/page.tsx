'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/markdown-editor';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const { id } = await params;
      setPostId(id);
      try {
        const res = await fetch(`/api/posts/${id}`);
        const result = await res.json();
        if (result.success) {
          const post = result.data;
          setTitle(post.title);
          setSlug(post.slug);
          setExcerpt(post.excerpt || '');
          setContent(post.content || '');
          setTagsInput((post.tags || []).join(', '));
          setStatus(post.status);
        } else {
          alert(`加载失败: ${result.error}`);
          router.push('/admin');
        }
      } catch (err) {
        alert(`加载失败: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params, router]);

  const handleSave = async (newStatus?: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!slug.trim()) {
      alert('请输入文章 slug');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const targetStatus = newStatus || status;

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          tags,
          status: targetStatus,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert('保存成功！');
        setStatus(targetStatus);
      } else {
        alert(`保存失败: ${result.error}`);
      }
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center text-[#6b7280]">
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2c2c2c]">
            编辑文章
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            当前状态：
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                status === 'published'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-[#f3efe7] text-[#78716c]'
              }`}
            >
              {status === 'published' ? '已发布' : '草稿'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-[#6b7280] hover:text-[#b45309]"
          >
            返回列表
          </Link>
          <Link
            href={`/posts/${slug}`}
            target="_blank"
            className="text-sm text-[#b45309] hover:text-[#92400e] underline"
          >
            预览文章
          </Link>
          <Button
            onClick={() => handleSave('draft')}
            disabled={saving}
            variant="outline"
            className="border-[#d6d3cb] text-[#4b5563] hover:bg-[#f3efe7]"
          >
            保存草稿
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-[#b45309] hover:bg-[#92400e] text-white"
          >
            {status === 'published' ? '更新发布' : '发布文章'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
            标题 <span className="text-red-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="text-lg py-6"
          />
        </div>

        {/* Slug + 标签 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="文章 URL 标识"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
              标签
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="多个标签用逗号分隔"
            />
          </div>
        </div>

        {/* 摘要 */}
        <div>
          <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
            摘要
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="文章简介"
            rows={2}
            className="w-full px-3 py-2 border border-[#e7e2d8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#b45309]/30 focus:border-[#b45309] resize-none"
          />
        </div>

        {/* 内容编辑器 */}
        <div>
          <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
            正文
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="开始写作..."
          />
        </div>
      </div>
    </div>
  );
}
