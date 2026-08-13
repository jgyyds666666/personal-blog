import type { Metadata } from 'next';
import { PostManager } from '@/components/post-manager';

export const metadata: Metadata = { title: '文章管理', description: '添加和修改博客文章' };

export default function AdminPage() { return <PostManager />; }
