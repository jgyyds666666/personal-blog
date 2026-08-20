'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于' },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#e7e2d8] bg-[#faf8f5]/85 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-serif font-semibold text-[#2c2c2c] transition-colors hover:text-[#b45309]"
        >
          墨香
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6" aria-label="主导航">
          {navLinks.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm transition-colors ${
                  active
                    ? 'font-medium text-[#b45309]'
                    : 'text-[#4b5563] hover:text-[#b45309]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/admin"
            aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
            className={`text-sm transition-colors ${
              pathname.startsWith('/admin')
                ? 'font-medium text-[#b45309]'
                : 'text-[#4b5563] hover:text-[#b45309]'
            }`}
          >
            文章管理
          </Link>
        </nav>
      </div>
    </header>
  );
}
