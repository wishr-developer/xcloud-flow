/**
 * Tiny in-process rate limiter.
 *
 * Notes:
 * - Suitable as a soft anti-abuse guard on public endpoints (contact form,
 *   AI assistant, guest booking creation). Bypasses are possible because each
 *   serverless instance has its own counters — pair with Vercel firewall /
 *   WAF / Cloudflare for hard limits.
 * - Memory-only; no persistence. Limits reset on cold start, which is fine
 *   for the abuse classes we care about (single-IP spamming a single instance).
 */

interface Counter {
  count: number;
  resetAt: number;
}

const counters = new Map<string, Counter>();

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = counters.get(opts.key);
  if (!existing || existing.resetAt < now) {
    counters.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs };
  }
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  counters.set(opts.key, existing);
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    resetAt: existing.resetAt,
  };
}
