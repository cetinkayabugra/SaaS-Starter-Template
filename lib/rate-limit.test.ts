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

  it("allows requests up to the limit", async () => {
    const key = nextKey();
    expect((await rateLimit(key, OPTS)).ok).toBe(true);
    expect((await rateLimit(key, OPTS)).ok).toBe(true);
    expect((await rateLimit(key, OPTS)).ok).toBe(true);
  });

  it("blocks the request that exceeds the limit", async () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) await rateLimit(key, OPTS);
    expect((await rateLimit(key, OPTS)).ok).toBe(false);
  });

  it("counts each key independently", async () => {
    const a = nextKey();
    const b = nextKey();
    for (let i = 0; i < OPTS.limit; i++) await rateLimit(a, OPTS);

    expect((await rateLimit(a, OPTS)).ok).toBe(false);
    expect((await rateLimit(b, OPTS)).ok).toBe(true);
  });

  it("reports remaining count down to zero without going negative", async () => {
    const key = nextKey();
    expect((await rateLimit(key, OPTS)).remaining).toBe(2);
    expect((await rateLimit(key, OPTS)).remaining).toBe(1);
    expect((await rateLimit(key, OPTS)).remaining).toBe(0);
    expect((await rateLimit(key, OPTS)).remaining).toBe(0);
  });

  it("resets once the window elapses", async () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) await rateLimit(key, OPTS);
    expect((await rateLimit(key, OPTS)).ok).toBe(false);

    vi.advanceTimersByTime(OPTS.windowMs);

    expect((await rateLimit(key, OPTS)).ok).toBe(true);
  });

  it("does not reset before the window elapses", async () => {
    const key = nextKey();
    for (let i = 0; i < OPTS.limit; i++) await rateLimit(key, OPTS);

    vi.advanceTimersByTime(OPTS.windowMs - 1);

    expect((await rateLimit(key, OPTS)).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  const withHeaders = (headers: Record<string, string>) =>
    new Request("https://example.com", { headers });

  it("reads the entry written by the single trusted proxy", () => {
    // One proxy appends the peer it actually saw, so that's the last entry.
    const req = withHeaders({ "x-forwarded-for": "203.0.113.1, 70.41.3.18" });
    expect(getClientIp(req)).toBe("70.41.3.18");
  });

  it("ignores a client-spoofed prefix", () => {
    // The security case: a caller sending its own x-forwarded-for must not be
    // able to choose its bucket, or the rate limit is bypassed by rotating it.
    const spoofed = withHeaders({
      "x-forwarded-for": "1.1.1.1, 2.2.2.2, 198.51.100.7",
    });
    expect(getClientIp(spoofed)).toBe("198.51.100.7");
  });

  it("gives a spoofing caller the same bucket every time", () => {
    const a = getClientIp(withHeaders({ "x-forwarded-for": "9.9.9.9, 198.51.100.7" }));
    const b = getClientIp(withHeaders({ "x-forwarded-for": "8.8.8.8, 198.51.100.7" }));
    expect(a).toBe(b);
  });

  it("counts back further when more proxies are trusted", () => {
    const req = withHeaders({
      "x-forwarded-for": "1.1.1.1, 203.0.113.5, 10.0.0.1",
    });
    expect(getClientIp(req, 2)).toBe("203.0.113.5");
  });

  it("handles a single-entry header", () => {
    expect(getClientIp(withHeaders({ "x-forwarded-for": "203.0.113.4" }))).toBe(
      "203.0.113.4"
    );
  });

  it("tolerates padding and empty segments", () => {
    const req = withHeaders({ "x-forwarded-for": " 1.1.1.1 ,, 203.0.113.8 " });
    expect(getClientIp(req)).toBe("203.0.113.8");
  });

  it("refuses to guess when the chain is shorter than the trusted hop count", () => {
    // Trusting a leftover entry here would read attacker-supplied input.
    const req = withHeaders({ "x-forwarded-for": "1.1.1.1" });
    expect(getClientIp(req, 3)).toBe("unknown");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(withHeaders({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("returns a stable placeholder when no IP header is present", () => {
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });

  it("returns the placeholder rather than an empty string", () => {
    expect(getClientIp(withHeaders({ "x-real-ip": "   " }))).toBe("unknown");
  });
});
