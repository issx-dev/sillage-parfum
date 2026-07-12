import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup ──────────────────────────────────────────────
// data.ts imports "@/lib/db" and "server-only" at module scope.
// We mock both so the data module can load in the test environment.

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("server-only", () => ({}));

import { query } from "@/lib/db";
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getProductsByGender,
  getFeaturedProducts,
  getNewArrivals,
  getDiscoverProducts,
  getVariant,
  searchProducts,
} from "./data";

const mockQuery = vi.mocked(query);

// ── Test fixtures ───────────────────────────────────────────
// Row shapes as they arrive from PostgreSQL (snake_case columns).

function makeProductRow(
  overrides: Partial<Record<string, unknown>> = {}
): Record<string, unknown> {
  return {
    product_id: "test-1",
    slug: "test-1-slug",
    name: "Test Product",
    brand: "TestBrand",
    family: "Floral",
    gender: "unisex",
    short_description: "A test fragrance",
    badge: null,
    images: ["/images/test.jpg"],
    discount_percent: 0,
    notes_top: ["Bergamota"],
    notes_heart: ["Rosa"],
    notes_base: ["Almizcle"],
    ...overrides,
  };
}

function makeVariantRow(
  overrides: Partial<Record<string, unknown>> = {}
): Record<string, unknown> {
  return {
    variant_id: "test-1-050",
    product_id: "test-1",
    size_ml: 50,
    price: 79,
    stock: 10,
    sku: "TEST-050",
    ...overrides,
  };
}

/**
 * Helper: set up mock so the FIRST query() call returns `productRows`
 * and the SECOND returns `variantRows`.  This matches hydrateProductsWithVariants
 * which queries products first, then variants via WHERE product_id = ANY($1).
 */
function mockProductAndVariantQueries(
  productRows: Record<string, unknown>[],
  variantRows: Record<string, unknown>[]
) {
  mockQuery
    .mockResolvedValueOnce(productRows as unknown[])
    .mockResolvedValueOnce(variantRows as unknown[]);
}

// ── getProducts ─────────────────────────────────────────────

describe("getProducts", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("returns a Promise", () => {
    mockProductAndVariantQueries([], []);
    expect(getProducts()).toBeInstanceOf(Promise);
  });

  it("queries all products when no family filter is provided", async () => {
    mockProductAndVariantQueries(
      [makeProductRow()],
      [makeVariantRow()]
    );

    const _products = await getProducts();

    expect(mockQuery).toHaveBeenCalledTimes(2);
    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("SELECT");
    expect(firstCall![0]).toContain("FROM products");
    // No WHERE clause for unfiltered query
    expect(firstCall![0]).not.toContain("WHERE");
    expect(firstCall![1]).toEqual([]);

    // Second call fetches variants
    const secondCall = mockQuery.mock.calls[1];
    expect(secondCall![0]).toContain("SELECT");
    expect(secondCall![0]).toContain("FROM variants");
    expect(secondCall![0]).toContain("ANY");
  });

  it("filters by family using ILIKE when family argument is provided", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ family: "Floral Aldehido" })],
      [makeVariantRow()]
    );

    await getProducts("Floral");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("WHERE");
    expect(firstCall![0]).toContain("ILIKE");
    expect(firstCall![1]).toEqual(["Floral"]);
  });

  it("returns [] when no products exist in DB", async () => {
    mockProductAndVariantQueries([], []);

    const products = await getProducts();
    expect(products).toEqual([]);
  });

  it("hydrates products with variants and correct shape", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ product_id: "p1", slug: "p1-slug" })],
      [
        makeVariantRow({ variant_id: "v1", product_id: "p1", size_ml: 50, price: 79 }),
        makeVariantRow({ variant_id: "v2", product_id: "p1", size_ml: 100, price: 120 }),
      ]
    );

    const products = await getProducts();

    expect(products).toHaveLength(1);
    const product = products[0]!;
    expect(product.id).toBe("p1");
    expect(product.slug).toBe("p1-slug");
    expect(product.shortDescription).toBe("A test fragrance");
    expect(product.discount_percent).toBe(0);
    expect(product.notes.top).toEqual(["Bergamota"]);
    expect(product.notes.heart).toEqual(["Rosa"]);
    expect(product.notes.base).toEqual(["Almizcle"]);
    expect(product.variants).toHaveLength(2);
    expect(product.variants[0]!.id).toBe("v1");
    expect(product.variants[0]!.size_ml).toBe(50);
    expect(product.variants[1]!.id).toBe("v2");
    expect(product.variants[1]!.price).toBe(120);
  });

  it("skips family filter when family is 'Todos'", async () => {
    mockProductAndVariantQueries([], []);

    await getProducts("Todos");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).not.toContain("WHERE");
  });
});

// ── getProductBySlug ────────────────────────────────────────

describe("getProductBySlug", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries by slug and returns hydrated product", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ slug: "chanel-5-edp", product_id: "chanel-5" })],
      [makeVariantRow({ product_id: "chanel-5" })]
    );

    const product = await getProductBySlug("chanel-5-edp");

    expect(product).toBeDefined();
    expect(product!.slug).toBe("chanel-5-edp");
    expect(product!.id).toBe("chanel-5");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("WHERE slug = $1");
    expect(firstCall![1]).toEqual(["chanel-5-edp"]);
  });

  it("returns undefined when product does not exist", async () => {
    mockQuery.mockResolvedValueOnce([] as unknown[]);

    const product = await getProductBySlug("nonexistent-slug");

    expect(product).toBeUndefined();
    // Only one query (products), no variants query needed
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

// ── getProductById ───────────────────────────────────────────

describe("getProductById", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries by product_id and returns hydrated product", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ product_id: "sauvage-dior" })],
      [makeVariantRow({ product_id: "sauvage-dior" })]
    );

    const product = await getProductById("sauvage-dior");

    expect(product).toBeDefined();
    expect(product!.id).toBe("sauvage-dior");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("WHERE product_id = $1");
    expect(firstCall![1]).toEqual(["sauvage-dior"]);
  });

  it("returns undefined when product not found", async () => {
    mockQuery.mockResolvedValueOnce([] as unknown[]);

    const product = await getProductById("nonexistent");
    expect(product).toBeUndefined();
  });
});

// ── getProductsByGender ─────────────────────────────────────

describe("getProductsByGender", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries with WHERE gender = $1 when gender is provided", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ gender: "femenino" })],
      [makeVariantRow()]
    );

    const products = await getProductsByGender("femenino");

    expect(products).toHaveLength(1);
    expect(products[0]!.gender).toBe("femenino");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("WHERE gender = $1");
    expect(firstCall![1]).toEqual(["femenino"]);
  });

  it("returns all products when gender is undefined", async () => {
    mockProductAndVariantQueries(
      [makeProductRow()],
      [makeVariantRow()]
    );

    await getProductsByGender(undefined);

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).not.toContain("WHERE gender");
  });
});

// ── getFeaturedProducts ──────────────────────────────────────

describe("getFeaturedProducts", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries products with badge = top_ventas", async () => {
    const featuredProducts = Array.from({ length: 8 }, (_, i) =>
      makeProductRow({ product_id: `feat-${i}`, badge: "top_ventas" })
    );
    mockProductAndVariantQueries(featuredProducts, [
      makeVariantRow({ product_id: "feat-0" }),
    ]);

    await getFeaturedProducts(8);

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("badge = $1");
    expect(firstCall![1]).toEqual(["top_ventas", 8]);
    // No fallback query since 8 products were found
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("returns featured products with variants hydrated", async () => {
    const featuredProducts = Array.from({ length: 8 }, (_, i) =>
      makeProductRow({ product_id: `feat-${i}`, badge: "top_ventas" })
    );
    mockProductAndVariantQueries(featuredProducts, [
      makeVariantRow({ product_id: "feat-0" }),
    ]);

    const products = await getFeaturedProducts(8);

    expect(products).toHaveLength(8);
    expect(products[0]!.badge).toBe("top_ventas");
    expect(products[0]!.variants).toHaveLength(1);
  });
});

// ── getNewArrivals ───────────────────────────────────────────

describe("getNewArrivals", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries products with badge = nuevo", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ badge: "nuevo" })],
      [makeVariantRow()]
    );

    await getNewArrivals();

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("badge = $1");
    expect(firstCall![1]).toEqual(["nuevo"]);
  });
});

// ── getDiscoverProducts ─────────────────────────────────────

describe("getDiscoverProducts", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("queries products excluding top_ventas", async () => {
    const discoverProducts = Array.from({ length: 8 }, (_, i) =>
      makeProductRow({ product_id: `disc-${i}`, badge: "nuevo" })
    );
    mockProductAndVariantQueries(discoverProducts, [
      makeVariantRow({ product_id: "disc-0" }),
    ]);

    await getDiscoverProducts(8);

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("badge != $1");
    expect(firstCall![1]).toEqual(["top_ventas", 8]);
    // No fallback since 8 products were found
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("returns products with variants hydrated", async () => {
    const discoverProducts = Array.from({ length: 8 }, (_, i) =>
      makeProductRow({ product_id: `disc-${i}`, badge: "nuevo" })
    );
    mockProductAndVariantQueries(discoverProducts, [
      makeVariantRow({ product_id: "disc-0" }),
    ]);

    const products = await getDiscoverProducts(8);
    expect(products).toHaveLength(8);
    expect(products[0]!.variants).toHaveLength(1);
  });
});

// ── getVariant ──────────────────────────────────────────────

describe("getVariant", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("returns { product, variant } for valid product + variant IDs", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ product_id: "sauvage-dior" })],
      [
        makeVariantRow({
          variant_id: "sauvage-050",
          product_id: "sauvage-dior",
          size_ml: 50,
          price: 79,
          sku: "SAUVAGE-050",
        }),
      ]
    );

    const result = await getVariant("sauvage-dior", "sauvage-050");

    expect(result).not.toBeNull();
    expect(result!.product.id).toBe("sauvage-dior");
    expect(result!.variant.id).toBe("sauvage-050");
    expect(result!.variant.size_ml).toBe(50);
    expect(result!.variant.price).toBe(79);
    expect(result!.variant.sku).toBe("SAUVAGE-050");
  });

  it("returns null for non-existent product ID", async () => {
    mockQuery.mockResolvedValueOnce([] as unknown[]);

    const result = await getVariant("not-a-real-product", "some-variant");
    expect(result).toBeNull();
  });

  it("returns null for valid product but invalid variant ID", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ product_id: "sauvage-dior" })],
      [makeVariantRow({ variant_id: "sauvage-050", product_id: "sauvage-dior" })]
    );

    const result = await getVariant("sauvage-dior", "wrong-variant-id");
    expect(result).toBeNull();
  });
});

// ── searchProducts ──────────────────────────────────────────

describe("searchProducts", () => {
  beforeEach(() => { mockQuery.mockReset(); });

  it("returns [] when query is shorter than 2 characters (no DB call)", async () => {
    const result1 = await searchProducts("");
    const result2 = await searchProducts("a");
    const result3 = await searchProducts(" ");

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    expect(result3).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("calls query with ILIKE pattern for valid search term", async () => {
    mockProductAndVariantQueries(
      [makeProductRow({ name: "Sauvage" })],
      [makeVariantRow()]
    );

    await searchProducts("sauvage");

    expect(mockQuery).toHaveBeenCalledTimes(2);
    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![0]).toContain("ILIKE");
    expect(firstCall![0]).toContain("name");
    expect(firstCall![0]).toContain("brand");
    expect(firstCall![0]).toContain("family");
    expect(firstCall![0]).toContain("notes_top");
    expect(firstCall![0]).toContain("notes_heart");
    expect(firstCall![0]).toContain("notes_base");
    expect(firstCall![0]).toContain("LIMIT");
  });

  it("normalizes the query (lowercase + strip accents) before sending to DB", async () => {
    mockProductAndVariantQueries([], []);

    await searchProducts("JAZMÍN");

    const firstCall = mockQuery.mock.calls[0];
    // Normalized: "jazmin" (lowercase, no diacritics)
    expect(firstCall![1]).toEqual(["jazmin", 12]);
  });

  it("trims whitespace from the query before matching", async () => {
    mockProductAndVariantQueries([], []);

    await searchProducts("   Dior   ");

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![1]).toEqual(["dior", 12]);
  });

  it("respects the limit argument", async () => {
    mockProductAndVariantQueries([], []);

    await searchProducts("chanel", 5);

    const firstCall = mockQuery.mock.calls[0];
    expect(firstCall![1]).toEqual(["chanel", 5]);
  });

  it("returns hydrated products from query results", async () => {
    mockProductAndVariantQueries(
      [
        makeProductRow({ product_id: "p1", name: "Chanel No5" }),
        makeProductRow({ product_id: "p2", name: "Chanel Bleu" }),
      ],
      [
        makeVariantRow({ variant_id: "v1", product_id: "p1" }),
        makeVariantRow({ variant_id: "v2", product_id: "p2" }),
      ]
    );

    const results = await searchProducts("chanel");

    expect(results).toHaveLength(2);
    expect(results[0]!.id).toBe("p1");
    expect(results[1]!.id).toBe("p2");
    expect(results[0]!.variants).toHaveLength(1);
    expect(results[1]!.variants).toHaveLength(1);
  });

  it("returns [] when no products match", async () => {
    mockProductAndVariantQueries([], []);

    const results = await searchProducts("zzzznotfound");
    expect(results).toEqual([]);
  });
});