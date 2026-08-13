import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: '墨香博客',
    template: '%s | 墨香博客',
  },
  description: '一个关于技术、读书与生活的个人博客',
  keywords: ['博客', '技术', '前端', '读书', '生活随笔'],
  authors: [{ name: '墨香' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#faf8f5] text-[#2c2c2c] antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
