'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/markdown-editor';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  // 自动生成 slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) {
      // 简单的 slug 生成：转拼音太复杂，这里用英文和数字
      const autoSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (autoSlug) {
        setSlug(autoSlug);
      }
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
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

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          tags,
          status,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert(status === 'published' ? '发布成功！' : '草稿已保存');
        router.push('/admin');
      } else {
        alert(`保存失败: ${result.error}`);
      }
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#2c2c2c]">
          新建文章
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-[#6b7280] hover:text-[#b45309]"
          >
            取消
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
            发布文章
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
            onChange={(e) => handleTitleChange(e.target.value)}
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
              placeholder="文章 URL 标识，如 hello-world"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4b5563] mb-1.5">
              标签
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="多个标签用逗号分隔，如 前端, React"
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
            placeholder="文章简介，显示在列表页"
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
            placeholder="开始写作...支持 Markdown 格式，可插入图片"
          />
        </div>
      </div>
    </div>
  );
}
