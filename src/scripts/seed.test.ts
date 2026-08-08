import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module so tests never touch a real connection.
vi.mock("@/lib/db", () => ({
  db: {},
  query: vi.fn(),
}));

import { query } from "@/lib/db";
import { prepareInserts, runSeed, formatSummary } from "./seed";
import type { SeedSummary } from "./seed";
import productsData from "@/lib/data/products.json";
import type { Product } from "@/types";

const mockQuery = vi.mocked(query);

// ---------------------------------------------------------------------------
// Cast helper: products.json is structurally compatible with Product but
// TypeScript's inferred JSON type is narrower.  We assert per-element so
// noUncheckedIndexedAccess does not force `| undefined` into every access.
// ---------------------------------------------------------------------------
const cast = (p: unknown): Product => p as Product;
const sauvage = cast(productsData[0]);

describe("prepareInserts — pure JSON→row mapping", () => {
  it("maps product identity fields (id, slug, name, brand, family, gender) to params 0-5", () => {
    const { productParams } = prepareInserts(sauvage);
    expect(productParams[0]).toBe(sauvage.id);
    expect(productParams[1]).toBe(sauvage.slug);
    expect(productParams[2]).toBe(sauvage.name);
    expect(productParams[3]).toBe(sauvage.brand);
    expect(productParams[4]).toBe(sauvage.family);
    expect(productParams[5]).toBe(sauvage.gender);
  });

  it("maps shortDescription, badge, images, discount_percent to params 6-9", () => {
    const { productParams } = prepareInserts(sauvage);
    expect(productParams[6]).toBe(sauvage.shortDescription);
    expect(productParams[7]).toBe(sauvage.badge);
    expect(productParams[8]).toEqual(sauvage.images);
    expect(productParams[9]).toBe(sauvage.discount_percent);
  });

  it("maps notes.top, notes.heart, notes.base to separate array params 10-12", () => {
    const { productParams } = prepareInserts(sauvage);
    expect(productParams[10]).toEqual(sauvage.notes.top);
    expect(productParams[11]).toEqual(sauvage.notes.heart);
    expect(productParams[12]).toEqual(sauvage.notes.base);
  });

  it("preserves notes as JS arrays so the postgres driver encodes them as text[]", () => {
    const { productParams } = prepareInserts(sauvage);
    expect(Array.isArray(productParams[10])).toBe(true);
    expect(Array.isArray(productParams[11])).toBe(true);
    expect(Array.isArray(productParams[12])).toBe(true);
  });

  it("maps variants with variant_id, product_id FK, size_ml, price, stock, sku", () => {
    const { variantParamsList } = prepareInserts(sauvage);
    expect(variantParamsList).toHaveLength(2);
    expect(variantParamsList[0]).toEqual([
      "sauvage-030",
      "men-sauvage",
      30,
      25.5,
      25,
      "CHOGAN-094-30",
    ]);
  });

  it("binds product_id in every variant params to the parent product id", () => {
    const baccarat = cast(
      productsData.find((p) => (p as Product).id === "unisex-baccarat-rouge")
    );
    const { variantParamsList } = prepareInserts(baccarat);
    expect(variantParamsList.every((vp) => vp[1] === "unisex-baccarat-rouge")).toBe(true);
  });

  it("handles products with null badge (maps to SQL NULL)", () => {
    const kids = cast(
      productsData.find((p) => (p as Product).id === "kids-babys-parfum")
    );
    const { productParams } = prepareInserts(kids);
    expect(productParams[7]).toBeNull();
  });

  it("handles products with 4-element note arrays (Aventus Creed)", () => {
    const aventus = cast(
      productsData.find((p) => (p as Product).id === "unisex-aventus")
    );
    const { productParams } = prepareInserts(aventus);
    expect(productParams[10]).toHaveLength(4);
    expect(productParams[11]).toHaveLength(4);
    expect(productParams[12]).toHaveLength(4);
  });

  it("produces product SQL with INSERT INTO products ... ON CONFLICT DO NOTHING", () => {
    const { productSql } = prepareInserts(sauvage);
    expect(productSql).toContain("INSERT INTO products");
    expect(productSql).toContain("ON CONFLICT");
    expect(productSql).toContain("DO NOTHING");
    expect(productSql).toContain("RETURNING");
  });

  it("produces variant SQL with INSERT INTO variants ... ON CONFLICT DO NOTHING", () => {
    const { variantSql } = prepareInserts(sauvage);
    expect(variantSql).toContain("INSERT INTO variants");
    expect(variantSql).toContain("ON CONFLICT");
    expect(variantSql).toContain("DO NOTHING");
    expect(variantSql).toContain("RETURNING");
  });

  it("produces 13 positional placeholders ($1..$13) in product SQL", () => {
    const { productSql } = prepareInserts(sauvage);
    for (let i = 1; i <= 13; i++) {
      expect(productSql).toContain(`$${i}`);
    }
  });

  it("produces 6 positional placeholders ($1..$6) in variant SQL", () => {
    const { variantSql } = prepareInserts(sauvage);
    for (let i = 1; i <= 6; i++) {
      expect(variantSql).toContain(`$${i}`);
    }
  });
});

describe("runSeed — orchestration with mocked query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls query() exactly 122 times (45 products + 77 variants)", async () => {
    mockQuery.mockResolvedValue([{ product_id: "x" }]);
    await runSeed();
    expect(mockQuery).toHaveBeenCalledTimes(122);
  });

  it("reports all inserted when query returns rows (fresh DB scenario)", async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("products")) return [{ product_id: "x" }];
      return [{ variant_id: "x" }];
    });
    const summary = await runSeed();
    expect(summary).toEqual({
      productsInserted: 45,
      productsSkipped: 0,
      variantsInserted: 77,
      variantsSkipped: 0,
    } satisfies SeedSummary);
  });

  it("reports all skipped when query returns empty arrays (idempotent re-run)", async () => {
    mockQuery.mockResolvedValue([]);
    const summary = await runSeed();
    expect(summary).toEqual({
      productsInserted: 0,
      productsSkipped: 45,
      variantsInserted: 0,
      variantsSkipped: 77,
    } satisfies SeedSummary);
  });

  it("passes correct product params for the first INSERT (notes as arrays)", async () => {
    mockQuery.mockResolvedValue([{ product_id: "x" }]);
    await runSeed();
    const firstCall = mockQuery.mock.calls[0]!;
    expect(firstCall[0]).toContain("INSERT INTO products");
    expect(firstCall[1]).toEqual([
      sauvage.id,
      sauvage.slug,
      sauvage.name,
      sauvage.brand,
      sauvage.family,
      sauvage.gender,
      sauvage.shortDescription,
      sauvage.badge,
      sauvage.images,
      sauvage.discount_percent,
      sauvage.notes.top,
      sauvage.notes.heart,
      sauvage.notes.base,
    ]);
  });

  it("passes correct variant params for the first variant INSERT (call #1, interleaved)", async () => {
    mockQuery.mockResolvedValue([{ product_id: "x" }]);
    await runSeed();
    const variantCall = mockQuery.mock.calls[1]!;
    expect(variantCall[0]).toContain("INSERT INTO variants");
    expect(variantCall[1]).toEqual(["sauvage-030", "men-sauvage", 30, 25.5, 25, "CHOGAN-094-30"]);
  });

  it("alternates product INSERT then its variants (interleaved order)", async () => {
    mockQuery.mockResolvedValue([{ product_id: "x" }]);
    await runSeed();
    const calls = mockQuery.mock.calls;
    expect(calls[0]![0]).toContain("INSERT INTO products");
    expect(calls[1]![0]).toContain("INSERT INTO variants");
    expect(calls[2]![0]).toContain("INSERT INTO variants");
    expect(calls[3]![0]).toContain("INSERT INTO products");
  });

  it("does not throw when all inserts are no-ops (idempotent re-run)", async () => {
    mockQuery.mockResolvedValue([]);
    await expect(runSeed()).resolves.not.toThrow();
  });
});

describe("formatSummary — pure output formatting", () => {
  it("formats a fresh-seed summary with inserted counts", () => {
    const s = formatSummary({
      productsInserted: 12,
      productsSkipped: 0,
      variantsInserted: 36,
      variantsSkipped: 0,
    });
    expect(s).toContain("12");
    expect(s).toContain("36");
    expect(s).toContain("products");
    expect(s).toContain("variants");
  });

  it("formats an idempotent re-run summary with skipped counts", () => {
    const s = formatSummary({
      productsInserted: 0,
      productsSkipped: 12,
      variantsInserted: 0,
      variantsSkipped: 36,
    });
    expect(s).toContain("0");
    expect(s).toContain("skipped");
  });

  it("always contains the word 'Seed'", () => {
    const s = formatSummary({
      productsInserted: 5,
      productsSkipped: 7,
      variantsInserted: 15,
      variantsSkipped: 21,
    });
    expect(s).toContain("Seed");
  });
});