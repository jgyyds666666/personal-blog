import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminLogoutButton } from '@/components/admin-logout-button';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await isAdminAuthenticated())) {
    redirect('/login');
  }

  return (
    <>
      <header className="border-b border-[#e7e2d8] bg-white">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-medium text-[#57534e] transition-colors hover:text-[#b45309]">
            我的博客
          </Link>
          <AdminLogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}
