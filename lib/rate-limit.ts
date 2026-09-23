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

/** Bucket key used when no trustworthy client address can be determined. */
export const UNKNOWN_CLIENT = "unknown";

/**
 * Best-effort client address, for use as a rate-limit bucket key — never as an
 * authentication signal.
 *
 * `trustedProxyHops` is how many proxies sit between the client and this app
 * and append to `x-forwarded-for` (1 for a single reverse proxy or platform
 * edge such as Vercel — the common case). Setting it too high reads an
 * attacker-supplied value; too low buckets everyone behind your proxy together.
 */
export function getClientIp(req: Request, trustedProxyHops = 1): string {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);

    // Proxies APPEND to this header, so the leftmost entry is whatever the
    // client claimed and is fully attacker-controlled — reading it lets anyone
    // get a fresh rate-limit bucket per request just by rotating the value.
    // Count from the right instead: with N trusted proxies in front of the
    // app, the real peer is the Nth entry from the end, because those are the
    // only entries your own infrastructure wrote.
    const index = hops.length - trustedProxyHops;
    const candidate = hops[index];
    if (candidate) return candidate;

    // Fewer entries than configured hops means the header didn't pass through
    // the expected chain. Trusting any part of it here would be guessing.
    return UNKNOWN_CLIENT;
  }

  return req.headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT;
}
