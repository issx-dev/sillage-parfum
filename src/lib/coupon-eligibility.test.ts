// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { hasPriorOrders, isCouponEligibleForEmail } from "./coupon-eligibility";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe("hasPriorOrders", () => {
  it("returns true when the email has orders (normalized to lowercase)", async () => {
    mockQuery.mockResolvedValue([{ "1": 1 }]);
    expect(await hasPriorOrders("  ANA@Email.com ")).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ["ana@email.com"]);
  });

  it("returns false when the email has no orders", async () => {
    mockQuery.mockResolvedValue([]);
    expect(await hasPriorOrders("nueva@email.com")).toBe(false);
  });

  it("returns false for empty email without querying", async () => {
    expect(await hasPriorOrders("   ")).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("isCouponEligibleForEmail", () => {
  it("accepts SILLAGE2 for any email (no first-order restriction)", async () => {
    mockQuery.mockResolvedValue([{ "1": 1 }]);
    expect(await isCouponEligibleForEmail("SILLAGE2", "vieja@email.com")).toEqual({
      eligible: true,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("accepts BIENVENIDA10 for an email with no prior orders", async () => {
    mockQuery.mockResolvedValue([]);
    expect(await isCouponEligibleForEmail("bienvenida10", "nueva@email.com")).toEqual({
      eligible: true,
    });
  });

  it("rejects BIENVENIDA10 for an email with prior orders", async () => {
    mockQuery.mockResolvedValue([{ "1": 1 }]);
    const result = await isCouponEligibleForEmail("BIENVENIDA10", "vieja@email.com");
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/primer pedido/i);
  });

  it("accepts BIENVENIDA10 without email (verified at charge time)", async () => {
    expect(await isCouponEligibleForEmail("BIENVENIDA10")).toEqual({ eligible: true });
    expect(await isCouponEligibleForEmail("BIENVENIDA10", null)).toEqual({
      eligible: true,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("rejects unknown codes", async () => {
    const result = await isCouponEligibleForEmail("FAKE99", "a@b.com");
    expect(result.eligible).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
