'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function DocumentActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState(title);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function mutate(method: 'PATCH' | 'DELETE') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/documents/${id}`, { method,
        headers: method === 'PATCH' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'PATCH' ? JSON.stringify({ title: newTitle }) : undefined,
      });
      if (response.status === 401) { router.replace('/login?next=/'); router.refresh(); return; }
      const result: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || '操作失败。');
      setRenameOpen(false);
      setDeleteOpen(false);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败，请重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1">
      <Button asChild variant="ghost" size="sm" className="text-[#78716c]"><a href={`/api/documents/${id}/download`}><Download className="size-3.5" />下载原文件</a></Button>
      <Dialog open={renameOpen} onOpenChange={(value) => { if (!busy) { setRenameOpen(value); setNewTitle(title); setError(''); } }}>
        <DialogTrigger asChild><Button variant="ghost" size="sm" className="text-[#78716c]"><Pencil className="size-3.5" />改名</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>修改文档名称</DialogTitle><DialogDescription>修改显示名称，原文件名保持不变。</DialogDescription></DialogHeader>
          <Input aria-label="文档名称" value={newTitle} maxLength={255} disabled={busy} onChange={(event) => setNewTitle(event.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button disabled={busy || !newTitle.trim()} onClick={() => void mutate('PATCH')}>{busy ? '正在保存…' : '保存名称'}</Button>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={(value) => { if (!busy) { setDeleteOpen(value); setError(''); } }}>
        <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-[#78716c] hover:text-red-700"><Trash2 className="size-3.5" />删除</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>删除这份文档？</AlertDialogTitle><AlertDialogDescription>“{title}”及其原文件、图片将被删除，此操作无法撤销。</AlertDialogDescription></AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>取消</AlertDialogCancel><AlertDialogAction disabled={busy} className="bg-red-700 hover:bg-red-800" onClick={(event) => { event.preventDefault(); void mutate('DELETE'); }}>{busy ? '正在删除…' : '确认删除'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
