'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps { value: string; onChange: (value: string) => void; placeholder?: string; }
const toolbarButtons = [
  ['H1', 'heading-1', '一级标题'], ['H2', 'heading-2', '二级标题'], ['H3', 'heading-3', '三级标题'],
  ['B', 'bold', '加粗'], ['I', 'italic', '斜体'], ['❝', 'quote', '引用'], ['•', 'unordered-list', '无序列表'],
  ['1.', 'ordered-list', '有序列表'], ['<>', 'code', '行内代码'], ['{}', 'codeblock', '代码块'], ['↗', 'link', '链接'], ['图片', 'image', '插入图片'],
] as const;

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const insertText = useCallback((prefix: string, suffix = '', fallback = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    onChange(`${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`);
    window.setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); }, 0);
  }, [onChange, value]);

  function handleAction(action: string) {
    const actions: Record<string, () => void> = {
      'heading-1': () => insertText('# ', '', '一级标题'), 'heading-2': () => insertText('## ', '', '二级标题'), 'heading-3': () => insertText('### ', '', '三级标题'),
      bold: () => insertText('**', '**', '加粗文字'), italic: () => insertText('*', '*', '斜体文字'), quote: () => insertText('> ', '', '引用内容'),
      'unordered-list': () => insertText('- ', '', '列表项'), 'ordered-list': () => insertText('1. ', '', '列表项'), code: () => insertText('`', '`', '代码'), codeblock: () => insertText('```typescript\n', '\n```', '// 代码'), link: () => insertText('[', '](https://)', '链接文字'), image: () => fileInputRef.current?.click(),
    };
    actions[action]?.();
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result: { success?: boolean; data?: { url: string }; error?: string } = await response.json();
      if (!result.success || !result.data?.url) throw new Error(result.error || '图片上传失败');
      insertText(`![${file.name}](${result.data.url})`);
    } catch (error) { window.alert(error instanceof Error ? error.message : '图片上传失败，请稍后重试。'); }
    finally { setIsUploading(false); event.target.value = ''; }
  }

  return <div className="overflow-hidden rounded-lg border border-[#e7e2d8] bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-[#e7e2d8] bg-[#faf8f5] p-2">{toolbarButtons.map(([label, action, title]) => <button key={action} type="button" onClick={() => handleAction(action)} title={title} disabled={isUploading && action === 'image'} className="flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-xs font-medium text-[#4b5563] transition-colors hover:bg-[#e7e2d8] disabled:opacity-50">{label}</button>)}<span className="flex-1" /><Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((current) => !current)}>{showPreview ? '返回编辑' : '预览'}</Button></div><div className="relative">{showPreview ? <div className="post-content min-h-[400px] overflow-auto p-4" dangerouslySetInnerHTML={{ __html: renderPreview(value) }} /> : <Textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || '开始写作…'} className="min-h-[400px] resize-y border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-0" />}{isUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-[#6b7280]">图片上传中…</div>}</div><input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => void handleImageUpload(event)} className="hidden" /></div>;
}

function renderPreview(text: string): string { let html = escapeHtml(text.trim()); html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/^- (.*)$/gm, '<li>$1</li>'); return html.split(/\n\s*\n/).map((part) => { const trimmed = part.trim(); if (!trimmed) return ''; if (/^<(h1|h2|h3|pre|blockquote|li|img)/.test(trimmed)) return trimmed; return `<p>${trimmed.replace(/\n/g, ' ')}</p>`; }).join('\n'); }
function escapeHtml(text: string): string { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
