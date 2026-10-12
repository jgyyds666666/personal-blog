'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLogoutButton({ nextPath = '/login', label = '退出后台' }: { nextPath?: string; label?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('退出失败，请重试。');
      }

      // Reload after clearing the session so cached private content is discarded.
      window.location.replace(nextPath);
    } catch {
      setError('退出失败，请重试。');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={submitting}>
        <LogOut className="size-4" />
        {submitting ? '退出中…' : label}
      </Button>
      {error ? <span role="alert" className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
