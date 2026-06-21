import { describe, it, expect } from "vitest";

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