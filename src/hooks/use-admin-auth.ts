'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(!!data?.authenticated);
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { isLoggedIn, loading, refresh: checkAuth };
}
