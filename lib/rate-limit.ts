// In-memory fixed-window rate limiter.
//
// This is per-process state: it resets on redeploy and is NOT shared across
// instances, so on serverless/multi-instance hosting the effective limit is
// (limit x instance count). It's enough to stop casual abuse of the public
// chat endpoint, but a real deployment wants a shared store.
//
// The signature is async purely so that swap stays a change to this file:
// every distributed store (Upstash Redis, Vercel KV, ...) has an async API,
// and callers already await, so replacing the body below is the whole job.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Bound the map so a flood of unique IPs can't grow it without limit.
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      for (const [k, w] of windows) {
        if (now >= w.resetAt) windows.delete(k);
      }
      if (windows.size >= MAX_TRACKED_KEYS) windows.clear();
    }

    const window = { count: 1, resetAt: now + windowMs };
    windows.set(key, window);
    return { ok: true, remaining: limit - 1, resetAt: window.resetAt };
  }

  existing.count += 1;
  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Best-effort client IP. Values come from proxy-controlled headers, so treat
 * this as a rate-limit bucket key, never as an authentication signal.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
