'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import {
  Bold,
  Braces,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  PencilLine,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  action: string;
  label: string;
  title: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
}

const toolbarGroups: ToolbarButton[][] = [
  // 标题组
  [
    { action: 'heading-1', label: 'H1', title: '一级标题', icon: Heading1 },
    { action: 'heading-2', label: 'H2', title: '二级标题', icon: Heading2 },
    { action: 'heading-3', label: 'H3', title: '三级标题', icon: Heading3 },
  ],
  // 文本格式组
  [
    { action: 'bold', label: 'B', title: '加粗', icon: Bold },
    { action: 'italic', label: 'I', title: '斜体', icon: Italic },
    { action: 'quote', label: '引用', title: '引用', icon: Quote },
  ],
  // 列表组
  [
    { action: 'unordered-list', label: '列表', title: '无序列表', icon: List },
    { action: 'ordered-list', label: '编号', title: '有序列表', icon: ListOrdered },
  ],
  // 代码组
  [
    { action: 'code', label: '代码', title: '行内代码', icon: Code2 },
    { action: 'codeblock', label: '代码块', title: '代码块', icon: Braces },
  ],
  // 插入组
  [
    { action: 'link', label: '链接', title: '插入链接', icon: Link2 },
    { action: 'image', label: '图片', title: '插入图片', icon: ImagePlus },
  ],
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const insertText = useCallback(
    (prefix: string, suffix = '', fallback = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || fallback;
      onChange(
        `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`
      );
      window.setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selected.length
        );
      }, 0);
    },
    [onChange, value]
  );

  function handleAction(action: string) {
    const actions: Record<string, () => void> = {
      'heading-1': () => insertText('# ', '', '一级标题'),
      'heading-2': () => insertText('## ', '', '二级标题'),
      'heading-3': () => insertText('### ', '', '三级标题'),
      bold: () => insertText('**', '**', '加粗文字'),
      italic: () => insertText('*', '*', '斜体文字'),
      quote: () => insertText('> ', '', '引用内容'),
      'unordered-list': () => insertText('- ', '', '列表项'),
      'ordered-list': () => insertText('1. ', '', '列表项'),
      code: () => insertText('`', '`', '代码'),
      codeblock: () => insertText('```typescript\n', '\n```', '// 代码'),
      link: () => insertText('[', '](https://)', '链接文字'),
      image: () => fileInputRef.current?.click(),
    };
    actions[action]?.();
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result: {
        success?: boolean;
        data?: { url: string };
        error?: string;
      } = await response.json();
      if (!result.success || !result.data?.url)
        throw new Error(result.error || '图片上传失败');
      insertText(`![${file.name}](${result.data.url})`);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : '图片上传失败，请稍后重试。'
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e7e2d8] bg-white shadow-sm">
      {/* 工具栏 */}
      <div className="flex flex-nowrap items-center gap-1 border-b border-[#e7e2d8] bg-[#faf8f5] px-2 py-1.5">
        {toolbarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center">
            {groupIndex > 0 && (
              <span className="mx-1.5 h-5 w-px shrink-0 bg-[#e0dcd2]" />
            )}
            <div className="flex items-center gap-0.5">
              {group.map((button) => (
                <ToolbarItem
                  key={button.action}
                  button={button}
                  onClick={handleAction}
                  disabled={isUploading}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="min-w-2 flex-1" />

        {/* 预览切换 */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 text-xs font-medium text-[#57534e] hover:bg-[#e7e2d8] hover:text-[#b45309]"
          onClick={() => setShowPreview((current) => !current)}
        >
          {showPreview ? (
            <PencilLine className="size-4" strokeWidth={1.8} />
          ) : (
            <Eye className="size-4" strokeWidth={1.8} />
          )}
          <span>{showPreview ? '编辑' : '预览'}</span>
        </Button>
      </div>

      {/* 编辑区 / 预览区 */}
      <div className="relative">
        {showPreview ? (
          <div
            className="post-content min-h-[400px] overflow-auto p-5"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder || '开始写作…'}
            className="min-h-[400px] resize-y border-0 p-5 font-mono text-[13.5px] leading-relaxed text-[#2c2c2c] focus-visible:ring-0"
          />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-[#6b7280]">
            图片上传中…
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between border-t border-[#e7e2d8] bg-[#faf8f5] px-4 py-2 text-xs text-[#9ca3af]">
        <span>{value.length.toLocaleString()} 字符</span>
        <span className="font-medium tracking-wide">Markdown</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => void handleImageUpload(event)}
        className="hidden"
      />
    </div>
  );
}

/**
 * 工具栏按钮组件
 */
function ToolbarItem({
  button,
  onClick,
  disabled,
}: {
  button: ToolbarButton;
  onClick: (action: string) => void;
  disabled: boolean;
}) {
  const Icon = button.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(button.action)}
      title={button.title}
      aria-label={button.title}
      disabled={disabled}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#57534e] transition-all hover:bg-[#e7e2d8] hover:text-[#b45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b45309]/30 disabled:opacity-50"
    >
      <Icon className="size-4" strokeWidth={1.8} />
    </button>
  );
}

/**
 * 渲染预览 HTML
 */
function renderPreview(text: string): string {
  let html = escapeHtml(text.trim());

  html = html
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>');

  return html
    .split(/\n\s*\n/)
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      if (/^<(h1|h2|h3|pre|blockquote|li|img)/.test(trimmed))
        return trimmed;
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
