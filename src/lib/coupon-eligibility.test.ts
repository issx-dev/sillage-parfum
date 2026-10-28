// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { hasPriorOrders, isCouponEligibleForEmail } from "./coupon-eligibility";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

// La resolución del cupón consulta `coupons` y la elegibilidad consulta
// `orders`: el mock enruta por SQL para que cada una vea sus filas.
const COUPON_ROWS = [
  { code: "SILLAGE2", percent_off: 10, first_order_only: false, active: true },
  { code: "BIENVENIDA10", percent_off: 10, first_order_only: true, active: true },
];

function mockDb(orders: unknown[] = []) {
  mockQuery.mockImplementation(async (sql: unknown, values?: unknown) => {
    if (typeof sql === "string" && sql.includes("FROM coupons")) {
      const code = Array.isArray(values) ? String(values[0]) : null;
      return COUPON_ROWS.filter((c) => !code || c.code === code) as unknown[];
    }
    return orders as unknown[];
  });
}

function queriedOrders(): boolean {
  return mockQuery.mock.calls.some(([sql]) => String(sql).includes("FROM orders"));
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe("hasPriorOrders", () => {
  it("returns true when the email has orders (normalized to lowercase)", async () => {
    mockDb([{ "1": 1 }]);
    expect(await hasPriorOrders("  ANA@Email.com ")).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ["ana@email.com"]);
  });

  it("returns false when the email has no orders", async () => {
    mockDb([]);
    expect(await hasPriorOrders("nueva@email.com")).toBe(false);
  });

  it("returns false for empty email without querying", async () => {
    expect(await hasPriorOrders("   ")).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("isCouponEligibleForEmail", () => {
  it("accepts SILLAGE2 for any email (no first-order restriction)", async () => {
    mockDb([{ "1": 1 }]);
    expect(await isCouponEligibleForEmail("SILLAGE2", "vieja@email.com")).toEqual({
      eligible: true,
    });
    // El cupón se resuelve en DB, pero sin restricción no se toca `orders`.
    expect(queriedOrders()).toBe(false);
  });

  it("accepts BIENVENIDA10 for an email with no prior orders", async () => {
    mockDb([]);
    expect(await isCouponEligibleForEmail("bienvenida10", "nueva@email.com")).toEqual({
      eligible: true,
    });
  });

  it("rejects BIENVENIDA10 for an email with prior orders", async () => {
    mockDb([{ "1": 1 }]);
    const result = await isCouponEligibleForEmail("BIENVENIDA10", "vieja@email.com");
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/primer pedido/i);
  });

  it("accepts BIENVENIDA10 without email (verified at charge time)", async () => {
    mockDb([]);
    expect(await isCouponEligibleForEmail("BIENVENIDA10")).toEqual({ eligible: true });
    expect(await isCouponEligibleForEmail("BIENVENIDA10", null)).toEqual({
      eligible: true,
    });
    expect(queriedOrders()).toBe(false);
  });

  it("rejects unknown codes", async () => {
    mockDb([]);
    const result = await isCouponEligibleForEmail("FAKE99", "a@b.com");
    expect(result.eligible).toBe(false);
    expect(queriedOrders()).toBe(false);
  });
});
