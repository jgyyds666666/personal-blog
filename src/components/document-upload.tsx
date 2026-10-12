'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, LoaderCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DOCUMENT_ACCEPT, getDocumentFormat, MAX_DOCUMENT_SIZE } from '@/lib/document-types';

export function DocumentUpload({ onUploaded }: { onUploaded?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function selectFile(selected: File | undefined) {
    if (!selected || busy) return;
    setError('');
    setFile(null);
    if (!getDocumentFormat(selected.name)) return setError('仅支持 .md、.txt 和 .docx 文档。');
    if (!selected.size || selected.size > MAX_DOCUMENT_SIZE) return setError('文档不能为空且不能超过 10MB。');
    setFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 1) return setError('每次请选择一份文档。');
    selectFile(event.dataTransfer.files[0]);
  }

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/documents', { method: 'POST', body });
      if (response.status === 401) {
        router.replace('/login?next=/');
        router.refresh();
        return;
      }
      const result: { success?: boolean; error?: string; warnings?: string[] } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || '文档上传失败。');
      setMessage(`上传成功，文档已加入首页列表。${result.warnings?.length ? ` ${result.warnings.join(' ')}` : ''}`);
      setFile(null);
      setOpen(false);
      onUploaded?.();
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '文档上传失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); setError(''); setFile(null); } }}>
        <DialogTrigger asChild><Button className="bg-[#b45309] text-white hover:bg-[#92400e]"><FileUp className="size-4" />上传文档</Button></DialogTrigger>
        <DialogContent className="border-[#e7e2d8] bg-[#faf8f5] sm:max-w-lg" onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">上传私人文档</DialogTitle>
            <DialogDescription>上传后保存在首页，只有你登录后才能查看。</DialogDescription>
          </DialogHeader>
          <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center ${dragging ? 'border-[#b45309] bg-[#f3efe7]' : 'border-[#d6d3cb] bg-white/60'}`}>
            <Upload className="mx-auto mb-3 size-8 text-[#b45309]" />
            <p className="mb-2 text-sm text-[#57534e]">将文档拖到这里，或选择文件</p>
            <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>选择文档</Button>
            <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} disabled={busy} className="hidden" aria-label="选择上传文档" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
            <p className="mt-3 text-xs text-[#78716c]">支持 .md、.txt、.docx，单个文件不超过 10MB</p>
          </div>
          {file && <p className="break-all rounded-lg bg-[#f3efe7] px-3 py-2 text-sm text-[#57534e]">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
          <p className="text-xs leading-relaxed text-[#78716c]">Word 将采用博客阅读样式，复杂排版可能简化，原文件会保留。</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="button" disabled={!file || busy} onClick={() => void upload()} className="bg-[#b45309] text-white hover:bg-[#92400e]">
            {busy ? <><LoaderCircle className="size-4 animate-spin" />正在上传并解析…</> : '上传并保存'}
          </Button>
        </DialogContent>
      </Dialog>
      {message && <p role="status" className="mt-3 max-w-xl text-sm text-[#57534e]">{message}</p>}
    </div>
  );
}
