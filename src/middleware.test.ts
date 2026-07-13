import { describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// CSP nonce generation tests (existing)
// ---------------------------------------------------------------------------

describe("CSP nonce generation", () => {
  it("generates a base64-encoded nonce from crypto.randomUUID", () => {
    const nonce = btoa(crypto.randomUUID());
    expect(nonce.length).toBeGreaterThan(0);
    // Base64 strings only contain [A-Za-z0-9+/=]
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("generates unique nonces per call", () => {
    const nonces = new Set(
      Array.from({ length: 100 }, () =>
        btoa(crypto.randomUUID())
      )
    );
    // All 100 nonces should be unique
    expect(nonces.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// CSP header construction tests (existing)
// ---------------------------------------------------------------------------

describe("CSP header construction", () => {
  it("includes nonce placeholder in script-src directive", () => {
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCSP(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("https://js.stripe.com");
  });

  it("includes all required CSP directives (production mode)", () => {
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCSP(nonce, false);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("img-src 'self' data: https://images.unsplash.com https://*.sillage.com");
    expect(csp).toContain("connect-src 'self' https://api.stripe.com");
    expect(csp).toContain("frame-src https://js.stripe.com https://hooks.stripe.com");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self' https://checkout.stripe.com");
    expect(csp).toContain("object-src 'none'");
    // Production must NOT include unsafe-eval or ws://
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("ws://");
  });

  it("includes unsafe-eval and ws:// in dev mode", () => {
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCSP(nonce, true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).toContain("ws://127.0.0.1:*");
    // Dev must still include all security directives
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self' https://checkout.stripe.com");
  });
});

function buildCSP(nonce: string, isDev = false): string {
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://js.stripe.com`
    : `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`;

  const connectSrc = isDev
    ? `connect-src 'self' https://api.stripe.com ws://localhost:* ws://127.0.0.1:*`
    : `connect-src 'self' https://api.stripe.com`;

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://images.unsplash.com https://*.sillage.com`,
    connectSrc,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com`,
    `object-src 'none'`,
  ].join("; ");
}

// ---------------------------------------------------------------------------
// In-memory rate limiter — stale entry cleanup (Spec §4.2, task 2.3/2.4)
// ---------------------------------------------------------------------------

import { inMemoryRateLimit, rateLimitMap, WINDOW_MS } from "./middleware";

describe("inMemoryRateLimit — stale entry cleanup", () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it("purges entries with all timestamps older than WINDOW_MS", () => {
    const now = Date.now();
    // Add a stale entry (all timestamps outside the window)
    rateLimitMap.set("1.2.3.4", [now - WINDOW_MS - 1000, now - WINDOW_MS - 2000]);
    // Add a fresh entry (timestamps inside the window)
    rateLimitMap.set("5.6.7.8", [now - 5000]);

    expect(rateLimitMap.size).toBe(2);

    // Call for a different IP — triggers passive cleanup
    inMemoryRateLimit("9.9.9.9", 10);

    // Stale entry should be removed
    expect(rateLimitMap.has("1.2.3.4")).toBe(false);
    // Fresh entry should remain
    expect(rateLimitMap.has("5.6.7.8")).toBe(true);
    // New IP should be in the map
    expect(rateLimitMap.has("9.9.9.9")).toBe(true);
  });

  it("counts recent requests correctly during cleanup", () => {
    const now = Date.now();
    // IP with 5 recent requests (limit is 10)
    rateLimitMap.set("1.1.1.1", [
      now - 1000, now - 2000, now - 3000, now - 4000, now - 5000,
    ]);
    // Also add a stale entry
    rateLimitMap.set("2.2.2.2", [now - WINDOW_MS - 5000]);

    const result = inMemoryRateLimit("1.1.1.1", 10);

    expect(result.success).toBe(true);
    // 5 existing + 1 new = 6 total → remaining = 10 - 6
    expect(result.remaining).toBe(4);
    // Stale entry removed
    expect(rateLimitMap.has("2.2.2.2")).toBe(false);
    // Current IP has 6 timestamps now
    expect(rateLimitMap.get("1.1.1.1")?.length).toBe(6);
  });

  it("removes empty IP entry — all timestamps stale, key purged entirely", () => {
    const now = Date.now();
    // IP with all stale timestamps
    rateLimitMap.set("stale-ip", [now - WINDOW_MS - 1000]);

    expect(rateLimitMap.has("stale-ip")).toBe(true);

    // Call for a different IP — triggers cleanup
    inMemoryRateLimit("other-ip", 10);

    // stale-ip should be completely removed (no empty array retained)
    expect(rateLimitMap.has("stale-ip")).toBe(false);
  });

  it("treats IP with all stale timestamps as fresh on next request", () => {
    const now = Date.now();
    // Current IP has all stale timestamps
    rateLimitMap.set("current-ip", [
      now - WINDOW_MS - 1000,
      now - WINDOW_MS - 2000,
    ]);

    const result = inMemoryRateLimit("current-ip", 10);

    expect(result.success).toBe(true);
    // Starts fresh — 1 new request, remaining = 10 - 1
    expect(result.remaining).toBe(9);
    // Old timestamps should be filtered out — only the new one remains
    expect(rateLimitMap.get("current-ip")?.length).toBe(1);
  });

  it("rejects requests at the rate limit boundary", () => {
    const now = Date.now();
    // IP at the limit (10 recent requests)
    rateLimitMap.set("limited-ip", Array.from(
      { length: 10 },
      (_, i) => now - i * 100
    ));

    const result = inMemoryRateLimit("limited-ip", 10);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("cleans stale timestamps within an active entry to prevent unbounded growth", () => {
    const now = Date.now();
    // Add many stale timestamps for one IP
    rateLimitMap.set("ip-100", Array.from(
      { length: 100 },
      (_, i) => now - WINDOW_MS - i * 1000
    ));

    // Call for this IP — stale timestamps should be cleaned
    const result = inMemoryRateLimit("ip-100", 10);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    // Only the new timestamp should remain (all 100 stale ones were filtered)
    expect(rateLimitMap.get("ip-100")?.length).toBe(1);
  });

  it("preserves active entries while purging only stale ones", () => {
    const now = Date.now();
    rateLimitMap.set("active-a", [now - 1000, now - 2000]);
    rateLimitMap.set("active-b", [now - 3000]);
    rateLimitMap.set("stale-c", [now - WINDOW_MS - 1000]);
    rateLimitMap.set("mixed-d", [now - 1000, now - WINDOW_MS - 5000]);

    inMemoryRateLimit("new-ip", 10);

    expect(rateLimitMap.has("active-a")).toBe(true);
    expect(rateLimitMap.has("active-b")).toBe(true);
    expect(rateLimitMap.has("stale-c")).toBe(false);
    expect(rateLimitMap.has("mixed-d")).toBe(true);
    // mixed-d should have only the recent timestamp, stale one filtered out
    expect(rateLimitMap.get("mixed-d")?.length).toBe(1);
  });
});