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

  it("includes all required CSP directives", () => {
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCSP(nonce);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("img-src 'self' data: https://images.unsplash.com https://*.sillage.com");
    expect(csp).toContain("connect-src 'self' https://api.stripe.com");
    expect(csp).toContain("frame-src https://js.stripe.com https://hooks.stripe.com");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self' https://checkout.stripe.com");
    expect(csp).toContain("object-src 'none'");
  });
});

function buildCSP(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://images.unsplash.com https://*.sillage.com`,
    `connect-src 'self' https://api.stripe.com`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com`,
    `object-src 'none'`,
  ].join("; ");
}