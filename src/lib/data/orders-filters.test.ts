import { describe, it, expect, vi, beforeEach } from "vitest";

// Los filtros admin deben llegar a SQL de verdad: se espía `query` y se
// comprueba cláusula WHERE + parámetros + LIMIT/OFFSET por cada filtro.
vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { readOrdersPage, countOrders } from "./orders";
import { readVariantStock, countVariantStock, readProductsPage, countProducts } from "@/app/(admin)/admin/_lib/queries";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

function rows<T>(value: T[]): void {
  mockQuery.mockResolvedValue(value as unknown as unknown[]);
}

describe("filtros admin contra DB", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("pedidos: filtra por estado de pago en SQL", async () => {
    rows([]);
    await readOrdersPage({ status: "paid", limit: 20, offset: 0 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("payment_status = $1");
    expect(values).toContain("paid");
  });

  it("pedidos: filtra por estado de envío en SQL", async () => {
    rows([]);
    await readOrdersPage({ fulfillment: "enviado", limit: 20, offset: 0 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("fulfillment_status = $1");
    expect(values).toContain("enviado");
  });

  it("pedidos: busca por email con ILIKE", async () => {
    rows([]);
    await readOrdersPage({ email: "foo@bar.es", limit: 20, offset: 0 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("customer_email ILIKE");
    expect(values).toContain("%foo@bar.es%");
  });

  it("pedidos: combina estado + envío + email + paginación", async () => {
    rows([]);
    await readOrdersPage({ status: "paid", fulfillment: "pendiente", email: "a@b.c", limit: 20, offset: 40 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("payment_status");
    expect(sql).toContain("fulfillment_status");
    expect(sql).toContain("customer_email ILIKE");
    expect(sql).toMatch(/LIMIT \$\d+ OFFSET \$\d+/);
    expect(values.slice(-2)).toEqual([20, 40]);
  });

  it("pedidos: countOrders aplica los mismos filtros", async () => {
    rows([{ n: 0 }]);
    await countOrders({ status: "refunded", fulfillment: "enviado", email: "x@y.z" });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("COUNT(*)");
    expect(sql).toContain("payment_status");
    expect(sql).toContain("fulfillment_status");
    expect(sql).toContain("customer_email ILIKE");
    expect(values).toEqual(expect.arrayContaining(["refunded", "enviado", "%x@y.z%"]));
  });

  it("stock: busca por nombre o SKU en SQL", async () => {
    rows([]);
    await readVariantStock("CHOGAN-001", { limit: 20, offset: 0 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("p.name ILIKE $1");
    expect(sql).toContain("v.sku ILIKE $1");
    expect(values[0]).toBe("%CHOGAN-001%");
  });

  it("stock: countVariantStock repite el filtro", async () => {
    rows([{ n: 0 }]);
    await countVariantStock("dior");
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("COUNT(*)");
    expect(sql).toContain("ILIKE");
    expect(values).toEqual(["%dior%"]);
  });

  it("productos: busca por nombre, marca o slug en SQL", async () => {
    rows([]);
    await readProductsPage({ search: "sauvage", limit: 20, offset: 0 });
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("p.name ILIKE $1");
    expect(sql).toContain("p.brand ILIKE $1");
    expect(values[0]).toBe("%sauvage%");
  });

  it("productos: countProducts repite el filtro", async () => {
    rows([{ n: 0 }]);
    await countProducts("sauvage");
    const [sql, values] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("COUNT(*)");
    expect(values).toEqual(["%sauvage%"]);
  });
});
