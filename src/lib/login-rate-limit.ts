import 'server-only';

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

interface LoginAttemptState {
  failedAttempts: number;
  windowStartedAt: number;
  blockedUntil: number;
}

const attempts = new Map<string, LoginAttemptState>();

function removeExpiredAttempts(now: number): void {
  if (attempts.size < 1_000) return;
  attempts.forEach((state, identifier) => {
    if (state.blockedUntil <= now && now - state.windowStartedAt >= ATTEMPT_WINDOW_MS) {
      attempts.delete(identifier);
    }
  });
}

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor
    || request.headers.get('cf-connecting-ip')?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown-client';
}

export function getLoginLimit(request: Request, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  removeExpiredAttempts(now);
  const identifier = getClientIdentifier(request);
  const state = attempts.get(identifier);
  if (!state) return { allowed: true, retryAfterSeconds: 0 };

  if (state.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((state.blockedUntil - now) / 1000) };
  }

  if (now - state.windowStartedAt >= ATTEMPT_WINDOW_MS) {
    attempts.delete(identifier);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLogin(request: Request, now = Date.now()): void {
  removeExpiredAttempts(now);
  const identifier = getClientIdentifier(request);
  const existing = attempts.get(identifier);
  const state = !existing || now - existing.windowStartedAt >= ATTEMPT_WINDOW_MS
    ? { failedAttempts: 0, windowStartedAt: now, blockedUntil: 0 }
    : existing;

  state.failedAttempts += 1;
  if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_DURATION_MS;
  }
  attempts.set(identifier, state);
}

export function clearFailedLogins(request: Request): void {
  attempts.delete(getClientIdentifier(request));
}
