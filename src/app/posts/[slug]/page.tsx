import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedPosts, getPostBySlug } from '@/lib/posts-service';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    if (!post) {
      return { title: '文章未找到' };
    }
    return {
      title: post.title,
      description: post.excerpt || '',
    };
  } catch {
    return { title: '文章' };
  }
}

export const revalidate = 60;

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getPostBySlug>> = null;
  let error: string | null = null;

  try {
    post = await getPostBySlug(slug);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!post && !error) {
    notFound();
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-[#6b7280]">加载文章失败，请稍后重试</p>
        <Link
          href="/"
          className="inline-block mt-4 text-[#b45309] hover:text-[#92400e]"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-6 py-12">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#b45309] transition-colors mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        返回文章列表
      </Link>

      {/* 文章头部 */}
      <header className="mb-10">
        <div className="flex items-center gap-3 text-sm text-[#6b7280] mb-4">
          <time dateTime={post.created_at}>
            {formatDate(post.created_at)}
          </time>
          <span className="text-[#d6d3cb]">·</span>
          <span>{calculateReadingTime(post.content)} 分钟阅读</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2c2c2c] leading-tight mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-2">
          {(post.tags || []).map((tag: string) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-[#f3efe7] text-[#78716c]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {/* 文章正文 */}
      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
    </article>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateReadingTime(content: string): number {
  const chars = content.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(chars / 400));
}

function renderMarkdown(text: string): string {
  let html = text.trim();

  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // 引用块
  html = html.replace(/^> (.*)$/gm, (_, content) => {
    return `<blockquote>${content}</blockquote>`;
  });

  // 标题
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // 无序列表
  html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // 有序列表
  html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
    if (match.includes('<ul>')) return match;
    return `<ol>${match}</ol>`;
  });

  // 段落（空行分隔）
  const lines = html.split('\n');
  const result: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.trim()) {
        result.push(`<p>${currentParagraph.trim()}</p>`);
        currentParagraph = '';
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
      if (currentParagraph.trim()) {
        result.push(`<p>${currentParagraph.trim()}</p>`);
        currentParagraph = '';
      }
      result.push(line);
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
    }
  }
  if (currentParagraph.trim()) {
    result.push(`<p>${currentParagraph.trim()}</p>`);
  }

  return result.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
