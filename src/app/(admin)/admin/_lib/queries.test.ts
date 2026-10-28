import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ query: vi.fn(), transaction: vi.fn() }));

import { query } from "@/lib/db";
import {
  countProducts,
  countVariantStock,
  readOrderDetail,
  readProductsPage,
  readStockCounts,
  readVariantStock,
} from "./queries";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue([] as unknown[]);
});

describe("stock filters", () => {
  it("out: only zero-stock variants, most urgent first", async () => {
    await readVariantStock(undefined, { level: "out" });
    const sql = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("v.stock = 0");
    expect(sql).toContain("ORDER BY v.stock ASC");
  });

  it("low: 1..5 units, and the count uses the same condition", async () => {
    await readVariantStock(undefined, { level: "low" });
    await countVariantStock(undefined, "low");
    expect(mockQuery.mock.calls[0]![0]).toContain("v.stock BETWEEN 1 AND 5");
    expect(mockQuery.mock.calls[1]![0]).toContain("v.stock BETWEEN 1 AND 5");
  });

  it("binds the search once and keeps limit/offset after it", async () => {
    await readVariantStock("abyss", { level: "all", limit: 10, offset: 20 });
    const [sql, values] = mockQuery.mock.calls[0]!;
    expect(sql).toContain("ILIKE $1");
    expect(sql).toContain("LIMIT $2 OFFSET $3");
    expect(values).toEqual(["%abyss%", 10, 20]);
  });

  it("global counts come from a single query", async () => {
    mockQuery.mockResolvedValueOnce([{ total: 77, out_n: 1, low_n: 2 }] as unknown[]);
    expect(await readStockCounts()).toEqual({ total: 77, out: 1, low: 2 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe("product filters", () => {
  it("hidden = no variant with a positive price (what the storefront hides)", async () => {
    await readProductsPage({ filter: "hidden" });
    await countProducts(undefined, "hidden");
    for (const call of mockQuery.mock.calls) {
      expect(call[0]).toContain("HAVING COUNT(v.variant_id) FILTER (WHERE v.price > 0) = 0");
    }
  });

  it("out = total stock is zero; sale = discount above zero", async () => {
    await readProductsPage({ filter: "out" });
    await readProductsPage({ filter: "sale" });
    expect(mockQuery.mock.calls[0]![0]).toContain("HAVING COALESCE(SUM(v.stock), 0) = 0");
    expect(mockQuery.mock.calls[1]![0]).toContain("p.discount_percent > 0");
  });

  it("min price ignores invalid (<= 0) variants", async () => {
    await readProductsPage({});
    expect(mockQuery.mock.calls[0]![0]).toContain("MIN(v.price) FILTER (WHERE v.price > 0)");
  });
});

describe("readOrderDetail", () => {
  const baseRow = {
    id: "o1", stripe_event_id: "evt", stripe_session_id: "cs_1", customer_email: "a@b.c",
    amount_total: 4000, currency: "eur", payment_status: "paid", fulfillment_status: "pendiente",
    created_at: "2026-10-28T10:00:00Z",
  };

  it("fills name/size/price for legacy orders that only stored ids", async () => {
    mockQuery.mockResolvedValueOnce([
      { ...baseRow, order_data: { items: [{ variantId: "v1", productId: "p1", sku: "S", quantity: 1 }] } },
    ] as unknown[]);
    mockQuery.mockResolvedValueOnce([
      { variant_id: "v1", name: "Ruby Love", brand: "Chogan", size_ml: 70, price: "35.00", discount_percent: 0 },
    ] as unknown[]);

    const order = await readOrderDetail("o1");

    expect(order!.items[0]).toMatchObject({ name: "Ruby Love", size_ml: 70, price: 35, quantity: 1 });
    expect(Number.isFinite(order!.items[0]!.price)).toBe(true);
  });

  it("never yields NaN for a deleted variant and keeps address/payment data", async () => {
    mockQuery.mockResolvedValueOnce([
      {
        ...baseRow,
        order_data: {
          items: [{ variantId: "gone", productId: "p", quantity: 2 }],
          paymentMethod: "cod",
          couponCode: "SILLAGE2",
          shipping: { firstName: "Ana", lastName: "G", address: "Calle 1", city: "Madrid", postalCode: "28001", phone: "600" },
        },
      },
    ] as unknown[]);
    mockQuery.mockResolvedValueOnce([] as unknown[]);

    const order = await readOrderDetail("o1");

    expect(order!.items[0]).toMatchObject({ name: "Producto eliminado", price: 0 });
    expect(order).toMatchObject({ paymentMethod: "cod", couponCode: "SILLAGE2" });
    expect(order!.shipping?.postalCode).toBe("28001");
  });

  it("does not query the catalogue when items already carry a snapshot", async () => {
    mockQuery.mockResolvedValueOnce([
      { ...baseRow, order_data: { items: [{ variantId: "v1", name: "X", price: 10, size_ml: 50, quantity: 1 }] } },
    ] as unknown[]);
    await readOrderDetail("o1");
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
