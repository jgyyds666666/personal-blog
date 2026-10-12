export type DocumentFormat = 'md' | 'txt' | 'docx';

export interface DocumentAsset {
  id: string;
  key: string;
  contentType: string;
}

export interface PrivateDocumentSummary {
  id: string;
  title: string;
  excerpt: string;
  format: DocumentFormat;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateDocument extends PrivateDocumentSummary {
  content: string;
  original_key: string;
  assets: DocumentAsset[];
}

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = '.md,.txt,.docx';

export function getDocumentFormat(name: string): DocumentFormat | null {
  const extension = name.match(/\.(md|txt|docx)$/i)?.[1].toLowerCase();
  return extension === 'md' || extension === 'txt' || extension === 'docx' ? extension : null;
}
