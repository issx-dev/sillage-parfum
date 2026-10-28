import { describe, it, expect } from "vitest";
import { couponCodeSchema, couponInputSchema } from "./coupon-store";

describe("couponCodeSchema", () => {
  it("accepts uppercase codes with digits and dashes", () => {
    expect(couponCodeSchema.parse("VERANO15")).toBe("VERANO15");
    expect(couponCodeSchema.parse(" pack-2x63 ")).toBe("PACK-2X63");
  });

  it("rejects lowercase leftovers, spaces and symbols", () => {
    // El transform uppercases, así que "verano" pasa como VERANO (igual que
    // el checkout vía normalizeCoupon). Lo que NO pasa: símbolos y cortos.
    expect(couponCodeSchema.parse("verano")).toBe("VERANO");
    expect(() => couponCodeSchema.parse("AB")).toThrow();
    expect(() => couponCodeSchema.parse("VERANO 15")).toThrow();
    expect(() => couponCodeSchema.parse("VERANO%")).toThrow();
    expect(() => couponCodeSchema.parse("A".repeat(25))).toThrow();
  });
});

describe("couponInputSchema", () => {
  it("parses a valid coupon with defaults", () => {
    expect(couponInputSchema.parse({ code: "VERANO15", percentOff: 15 })).toEqual({
      code: "VERANO15",
      percentOff: 15,
      firstOrderOnly: false,
      active: true,
    });
  });

  it("rejects 0% and >90% (never free)", () => {
    expect(() => couponInputSchema.parse({ code: "X1", percentOff: 0 })).toThrow();
    expect(() => couponInputSchema.parse({ code: "X1", percentOff: 100 })).toThrow();
  });

  it("coerces form string numbers (FormData llega como string)", () => {
    const parsed = couponInputSchema.parse({ code: "VERANO15", percentOff: "20" });
    expect(parsed.percentOff).toBe(20);
  });
});
