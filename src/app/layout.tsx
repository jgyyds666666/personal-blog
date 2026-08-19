import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { absoluteUrl, SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: ['博客', '技术', '前端', '读书', '生活随笔'],
  authors: [{ name: SITE_AUTHOR }],
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body className="min-h-screen bg-[#faf8f5] text-[#2c2c2c] antialiased"><Navbar /><main className="min-h-[calc(100vh-4rem)]">{children}</main><Footer /></body></html>; }
