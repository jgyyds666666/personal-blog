export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#e7e2d8]">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-[#6b7280] md:flex-row">
        <p>© {new Date().getFullYear()} 墨香博客 · 用心记录，慢慢成长</p>
        <nav className="flex items-center gap-4" aria-label="页脚链接">
          <a href="https://github.com/jgyyds666666" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#b45309]">GitHub</a>
          <span className="text-[#e7e2d8]">·</span>
          <a href="/rss.xml" className="transition-colors hover:text-[#b45309]">RSS</a>
        </nav>
      </div>
    </footer>
  );
}
