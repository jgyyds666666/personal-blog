import 'server-only';

import { getSupabaseClient, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';
import type { PrivateDocument, PrivateDocumentSummary } from '@/lib/document-types';

export const DOCUMENT_BUCKET = 'private-documents';

export class DocumentConfigurationError extends Error {
  constructor(message = '私人文档服务尚未配置：请设置服务端密钥并执行文档数据库初始化脚本。') {
    super(message);
  }
}

export function getDocumentClient() {
  if (!getSupabaseServiceRoleKey()) throw new DocumentConfigurationError();
  return getSupabaseClient();
}

function databaseError(code: string, message: string): Error {
  if (code === 'PGRST204' || code === '42703') {
    console.error('私人文档数据库结构未更新:', code, message);
    return new DocumentConfigurationError('私人文档数据库结构尚未更新，请完成数据库迁移并刷新结构缓存后重试。');
  }
  if (code === '42P01' || code === 'PGRST205' || code === '42501') {
    return new DocumentConfigurationError();
  }
  console.error('私人文档数据库操作失败:', code, message);
  return new Error('文档服务暂时不可用，请稍后重试。');
}

export async function getPrivateDocumentSummaries(): Promise<PrivateDocumentSummary[]> {
  const { data, error } = await getDocumentClient().from('private_documents')
    .select('id,title,excerpt,format,original_name,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) throw databaseError(error.code, error.message);
  return (data ?? []) as PrivateDocumentSummary[];
}

export async function getPrivateDocument(id: string): Promise<PrivateDocument | null> {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) return null;
  const { data, error } = await getDocumentClient().from('private_documents').select('*').eq('id', id).maybeSingle();
  if (error) throw databaseError(error.code, error.message);
  return data as PrivateDocument | null;
}

export async function savePrivateDocument(document: Omit<PrivateDocument, 'created_at' | 'updated_at'>): Promise<PrivateDocumentSummary> {
  const { data, error } = await getDocumentClient().from('private_documents').insert(document)
    .select('id,title,excerpt,format,original_name,created_at,updated_at').single();
  if (error) throw databaseError(error.code, error.message);
  return data as PrivateDocumentSummary;
}

export async function renamePrivateDocument(id: string, title: string): Promise<void> {
  const { error } = await getDocumentClient().from('private_documents')
    .update({ title, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw databaseError(error.code, error.message);
}

export async function deletePrivateDocument(document: PrivateDocument): Promise<void> {
  const client = getDocumentClient();
  const { error } = await client.from('private_documents').delete().eq('id', document.id);
  if (error) throw databaseError(error.code, error.message);
  // Removing the row immediately revokes all app URLs, even if storage cleanup fails.
  const { error: storageError } = await client.storage.from(DOCUMENT_BUCKET)
    .remove([document.original_key, ...document.assets.map((asset) => asset.key)]);
  if (storageError) console.error('私人文档存储清理失败:', storageError.message);
}
