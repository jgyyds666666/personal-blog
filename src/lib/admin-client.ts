export function redirectIfAdminSessionExpired(response: Response): boolean {
  if (response.status !== 401 || typeof window === 'undefined') {
    return false;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
  return true;
}
