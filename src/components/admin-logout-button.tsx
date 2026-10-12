'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLogoutButton({ nextPath = '/login', label = '退出后台' }: { nextPath?: string; label?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace(nextPath);
      router.refresh();
      setSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={submitting}>
      <LogOut className="size-4" />
      {submitting ? '退出中…' : label}
    </Button>
  );
}
