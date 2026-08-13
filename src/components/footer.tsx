export function Footer() {
  return (
    <footer className="border-t border-[#e7e2d8] mt-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-[#6b7280]">
            © {new Date().getFullYear()} 墨香博客 · 用心记录，慢慢成长
          </div>
          <div className="flex items-center gap-4 text-sm text-[#6b7280]">
            <a
              href="#"
              className="hover:text-[#b45309] transition-colors"
              aria-label="GitHub"
            >
              GitHub
            </a>
            <span className="text-[#e7e2d8]">·</span>
            <a
              href="#"
              className="hover:text-[#b45309] transition-colors"
              aria-label="RSS"
            >
              RSS
            </a>
            <span className="text-[#e7e2d8]">·</span>
            <a
              href="mailto:hello@example.com"
              className="hover:text-[#b45309] transition-colors"
            >
              邮箱
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
