/**
 * Simple in-memory sliding-window rate limiter.
 * Uses a Map with TTL cleanup.
 */

const store = new Map<string, number[]>();

// Cleanup old entries every 60s
let lastCleanup = Date.now();
function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

/**
 * Check if a request is allowed under the rate limit.
 * Returns true if allowed, false if rate-limited.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanup(windowMs);

  const timestamps = store.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    store.set(key, valid);
    return false;
  }

  valid.push(now);
  store.set(key, valid);
  return true;
}
