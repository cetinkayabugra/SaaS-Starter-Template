import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getClientIp, rateLimit } from "@/lib/rate-limit";

const OPTS = { limit: 3, windowMs: 60_000 };

// Each test uses a unique key so the module-level window map doesn't leak
// state between tests.
let keyCounter = 0;
const nextKey = () => `key-${keyCounter++}`;

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    const key = nextKey();
    expect(rateLimit(key, OPTS).ok).toBe(true);
    expect(rateLimit(key, OPTS).ok).toBe(true);
    expect(rateLimit(key, OPTS).ok).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) rateLimit(key, OPTS);
    expect(rateLimit(key, OPTS).ok).toBe(false);
  });

  it("counts each key independently", () => {
    const a = nextKey();
    const b = nextKey();
    for (let i = 0; i < OPTS.limit; i++) rateLimit(a, OPTS);

    expect(rateLimit(a, OPTS).ok).toBe(false);
    expect(rateLimit(b, OPTS).ok).toBe(true);
  });

  it("reports remaining count down to zero without going negative", () => {
    const key = nextKey();
    expect(rateLimit(key, OPTS).remaining).toBe(2);
    expect(rateLimit(key, OPTS).remaining).toBe(1);
    expect(rateLimit(key, OPTS).remaining).toBe(0);
    expect(rateLimit(key, OPTS).remaining).toBe(0);
  });

  it("resets once the window elapses", () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) rateLimit(key, OPTS);
    expect(rateLimit(key, OPTS).ok).toBe(false);

    vi.advanceTimersByTime(OPTS.windowMs);

    expect(rateLimit(key, OPTS).ok).toBe(true);
  });

  it("does not reset before the window elapses", () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) rateLimit(key, OPTS);

    vi.advanceTimersByTime(OPTS.windowMs - 1);

    expect(rateLimit(key, OPTS).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("returns a stable placeholder when no IP header is present", () => {
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});
