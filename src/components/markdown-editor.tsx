'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const toolbarButtons = [
  { label: 'H1', action: 'heading-1', title: '一级标题' },
  { label: 'H2', action: 'heading-2', title: '二级标题' },
  { label: 'H3', action: 'heading-3', title: '三级标题' },
  { label: 'B', action: 'bold', title: '加粗' },
  { label: 'I', action: 'italic', title: '斜体' },
  { label: '—', action: 'quote', title: '引用' },
  { label: '•', action: 'unordered-list', title: '无序列表' },
  { label: '1.', action: 'ordered-list', title: '有序列表' },
  { label: '<>', action: 'code', title: '行内代码' },
  { label: '{}', action: 'codeblock', title: '代码块' },
  { label: '🔗', action: 'link', title: '链接' },
  { label: '🖼', action: 'image', title: '图片' },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = useCallback(
    (prefix: string, suffix = '', placeholderText = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || placeholderText;

      const newText =
        value.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        value.substring(end);

      onChange(newText);

      // 设置光标位置
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length + selectedText.length;
        textarea.setSelectionRange(
          start + prefix.length,
          newCursorPos
        );
      }, 0);
    },
    [value, onChange]
  );

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'heading-1':
          insertText('# ', '', '一级标题');
          break;
        case 'heading-2':
          insertText('## ', '', '二级标题');
          break;
        case 'heading-3':
          insertText('### ', '', '三级标题');
          break;
        case 'bold':
          insertText('**', '**', '加粗文字');
          break;
        case 'italic':
          insertText('*', '*', '斜体文字');
          break;
        case 'quote':
          insertText('> ', '', '引用内容');
          break;
        case 'unordered-list':
          insertText('- ', '', '列表项');
          break;
        case 'ordered-list':
          insertText('1. ', '', '列表项');
          break;
        case 'code':
          insertText('`', '`', '代码');
          break;
        case 'codeblock':
          insertText('```typescript\n', '\n```', '// 代码');
          break;
        case 'link':
          insertText('[', '](https://)', '链接文字');
          break;
        case 'image':
          fileInputRef.current?.click();
          break;
      }
    },
    [insertText]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        const imageMarkdown = `![${file.name}](${result.data.url})`;
        insertText(imageMarkdown, '', '');
      } else {
        alert(`上传失败: ${result.error}`);
      }
    } catch (err) {
      alert(`上传失败: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 简单的 Markdown 预览渲染
  const renderPreview = (text: string): string => {
    let html = text;

    // 代码块
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_, _lang, code) =>
        `<pre class="bg-[#2c2c2c] text-[#faf8f5] p-4 rounded-lg overflow-x-auto text-sm my-4"><code>${escapeHtml(
          code.trim()
        )}</code></pre>`
    );

    // 行内代码
    html = html.replace(
      /`([^`]+)`/g,
      (_, code) =>
        `<code class="bg-[#f3efe7] text-[#b45309] px-1.5 py-0.5 rounded text-sm">${escapeHtml(
          code
        )}</code>`
    );

    // 引用
    html = html.replace(
      /^> (.*)$/gm,
      '<blockquote class="border-l-4 border-[#b45309] pl-4 py-2 my-4 text-[#57534e] italic bg-[#f3efe7] rounded-r">$1</blockquote>'
    );

    // 标题
    html = html.replace(
      /^# (.*)$/gm,
      '<h1 class="text-3xl font-serif font-bold my-4">$1</h1>'
    );
    html = html.replace(
      /^## (.*)$/gm,
      '<h2 class="text-2xl font-serif font-semibold my-3 pb-2 border-b border-[#e7e2d8]">$1</h2>'
    );
    html = html.replace(
      /^### (.*)$/gm,
      '<h3 class="text-xl font-serif font-semibold my-3">$1</h3>'
    );

    // 加粗
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // 斜体
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 图片
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-lg">'
    );

    // 链接
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[#b45309] underline" target="_blank" rel="noopener">$1</a>'
    );

    // 无序列表
    html = html.replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(
      /((?:<li class="ml-4">.*<\/li>\n?)+)/g,
      '<ul class="list-disc pl-6 my-4 space-y-1">$1</ul>'
    );

    // 有序列表
    html = html.replace(/^\d+\. (.*)$/gm, '<li class="ml-4">$1</li>');

    // 段落
    const lines = html.split('\n');
    const result: string[] = [];
    let currentP = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentP.trim()) {
          result.push(`<p class="my-3 leading-relaxed">${currentP.trim()}</p>`);
          currentP = '';
        }
      } else if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('</') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<img')
      ) {
        if (currentP.trim()) {
          result.push(`<p class="my-3 leading-relaxed">${currentP.trim()}</p>`);
          currentP = '';
        }
        result.push(line);
      } else {
        currentP += (currentP ? ' ' : '') + trimmed;
      }
    }
    if (currentP.trim()) {
      result.push(`<p class="my-3 leading-relaxed">${currentP.trim()}</p>`);
    }

    return result.join('\n');
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  return (
    <div className="border border-[#e7e2d8] rounded-lg overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 border-b border-[#e7e2d8] bg-[#faf8f5] flex-wrap">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.action}
            onClick={() => handleAction(btn.action)}
            title={btn.title}
            className="w-8 h-8 flex items-center justify-center text-sm text-[#4b5563] hover:bg-[#e7e2d8] rounded transition-colors font-medium"
            disabled={isUploading && btn.action === 'image'}
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm px-3 py-1.5 rounded text-[#4b5563] hover:bg-[#e7e2d8] transition-colors"
        >
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑区 / 预览区 */}
      <div className="relative">
        {!showPreview ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || '开始写作...'}
            className="min-h-[400px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 font-mono text-sm leading-relaxed"
          />
        ) : (
          <div
            className="min-h-[400px] p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-sm text-[#6b7280]">图片上传中...</div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
