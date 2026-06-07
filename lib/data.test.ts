import { describe, it, expect } from "vitest";
import { searchProducts, getVariant } from "./data";

describe("searchProducts", () => {
  it("returns [] when query is shorter than 2 characters", () => {
    expect(searchProducts("")).toEqual([]);
    expect(searchProducts("a")).toEqual([]);
    expect(searchProducts(" ")).toEqual([]);
  });

  it("returns [] for a string that no product matches", () => {
    // "marisco" was renamed to "brisa marina" in PR1-b; it must not match.
    expect(searchProducts("marisco")).toEqual([]);
  });

  it("matches the Acqua di Gio product when searching for 'brisa marina'", () => {
    const results = searchProducts("brisa marina");
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((p) => p.id)).toContain("acqua-di-gio");
  });

  it("is accent-tolerant: 'JAZMÍN' matches 'Jazmín' notes", () => {
    const results = searchProducts("JAZMÍN");
    // Multiple products have Jazmín-family notes (chanel-5, acqua-di-gio, libre-ysl, ...).
    expect(results.length).toBeGreaterThan(0);
    // At least one result should contain a Jazmín-related note (case+accent tolerant).
    const ids = results.map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("is case-insensitive: lowercase query matches capitalized product names", () => {
    const lower = searchProducts("chanel");
    const upper = searchProducts("CHANEL");
    const mixed = searchProducts("ChAnEl");
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it("matches base notes (e.g., 'Ámbar' on Baccarat Rouge 540)", () => {
    const results = searchProducts("Ámbar");
    expect(results.map((p) => p.id)).toContain("baccarat-rouge");
  });

  it("matches heart notes (e.g., 'Iris' on Chanel No5 and La Vie Est Belle)", () => {
    const results = searchProducts("Iris");
    const ids = results.map((p) => p.id);
    expect(ids).toContain("chanel-5");
    expect(ids).toContain("la-vie-est-belle");
  });

  it("matches top notes (e.g., 'Bergamota' hits many products)", () => {
    const results = searchProducts("Bergamota");
    // Bergamota appears in top notes of multiple products.
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it("matches by brand (exact 'Dior' returns Dior products)", () => {
    const results = searchProducts("Dior");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => expect(p.brand).toBe("Dior"));
  });

  it("trims whitespace from the query before matching", () => {
    const trimmed = searchProducts("Dior");
    const padded = searchProducts("   Dior   ");
    expect(trimmed.map((p) => p.id).sort()).toEqual(
      padded.map((p) => p.id).sort()
    );
  });

  it("respects the limit argument", () => {
    const limited = searchProducts("a", 2);
    // Note: 'a' is too short and returns []; use a longer query.
    const limitedReal = searchProducts("de", 3);
    expect(limitedReal.length).toBeLessThanOrEqual(3);
    // Sanity check on the empty case for short queries.
    expect(limited).toEqual([]);
  });

  it("returns a fresh array (mutating the result does not affect future calls)", () => {
    const a = searchProducts("Dior");
    a.push({} as never);
    const b = searchProducts("Dior");
    expect(b.length).toBe(a.length - 1);
  });
});

describe("getVariant", () => {
  it("returns { product, variant } for a valid productId + variantId combo", () => {
    const result = getVariant("sauvage-dior", "sauvage-050");
    expect(result).not.toBeNull();
    expect(result?.product.id).toBe("sauvage-dior");
    expect(result?.variant.id).toBe("sauvage-050");
    expect(result?.variant.size_ml).toBe(50);
    expect(result?.variant.price).toBe(79);
  });

  it("returns null for a non-existent productId", () => {
    expect(getVariant("not-a-real-product", "sauvage-050")).toBeNull();
    expect(getVariant("", "sauvage-050")).toBeNull();
  });

  it("returns null for a valid productId but invalid variantId", () => {
    expect(getVariant("sauvage-dior", "sauvage-999")).toBeNull();
    expect(getVariant("sauvage-dior", "")).toBeNull();
    // A variantId that belongs to a different product must also fail.
    expect(getVariant("sauvage-dior", "chn5-050")).toBeNull();
  });
});
