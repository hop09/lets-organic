/**
 * Minimal in-memory rate limiter (per Node process).
 *
 * Good enough for a single-process VPS deployment (e.g. Hostinger VPS).
 * For multi-instance / serverless deployments, replace with a shared
 * store such as Redis/Upstash.
 */

const buckets = new Map();

// Periodic cleanup so the map can't grow forever.
// Guarded so dev hot-reloads don't stack intervals.
if (typeof global !== 'undefined' && !global.__rateLimitCleanup) {
  global.__rateLimitCleanup = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, stamps] of buckets) {
      const fresh = stamps.filter((t) => now - t < 60 * 60 * 1000);
      if (fresh.length === 0) buckets.delete(key);
      else buckets.set(key, fresh);
    }
  }, 10 * 60 * 1000);
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param {string} key - bucket key, e.g. `login:<ip>`
 * @param {{ limit: number, windowMs: number }} opts
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const stamps = buckets.get(key) || [];
  const fresh = stamps.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

/** Best-effort client IP for rate-limit bucketing. */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
