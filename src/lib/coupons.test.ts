import { describe, it, expect } from "vitest";
import { normalizeCoupon, getCoupon, applyCouponToTotal } from "./coupons";

describe("normalizeCoupon", () => {
  it("trims whitespace and uppercases", () => {
    expect(normalizeCoupon("  sillage2 ")).toBe("SILLAGE2");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeCoupon("")).toBe("");
  });
});

describe("getCoupon", () => {
  it("resolves SILLAGE2 (case-insensitive) to a 10% coupon", () => {
    expect(getCoupon("SILLAGE2")).toEqual({ code: "SILLAGE2", percentOff: 10 });
    expect(getCoupon("sillage2")).toEqual({ code: "SILLAGE2", percentOff: 10 });
  });

  it("returns null for unknown or empty codes", () => {
    expect(getCoupon("NOPE")).toBeNull();
    expect(getCoupon("")).toBeNull();
  });
});

describe("applyCouponToTotal", () => {
  it("applies 10% off for SILLAGE2", () => {
    expect(applyCouponToTotal(100, "SILLAGE2")).toBe(90);
  });

  it("rounds to 2 decimals", () => {
    expect(applyCouponToTotal(63, "SILLAGE2")).toBe(56.7);
  });

  it("leaves the total unchanged for unknown codes", () => {
    expect(applyCouponToTotal(100, "NOPE")).toBe(100);
    expect(applyCouponToTotal(100, "")).toBe(100);
  });
});
