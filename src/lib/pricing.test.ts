import { describe, it, expect } from "vitest";
import { priceLines, expectedTotalCents, type PricingLine, type ChargeLine } from "./pricing";

const std = (variantId: string, quantity: number): PricingLine => ({
  variantId,
  sizeMl: 70,
  unitPrice: 35,
  quantity,
});

const other = (variantId: string, unitPrice: number, quantity: number): PricingLine => ({
  variantId,
  sizeMl: 50,
  unitPrice,
  quantity,
});

function chargedTotal(r: { chargeLines: ChargeLine[] }): number {
  return r.chargeLines.reduce((s: number, l: ChargeLine) => s + l.unitAmountCents * l.quantity, 0);
}

describe("priceLines (multibuy bundles)", () => {
  it("charges a single 70ml/35€ unit at face value", () => {
    const r = priceLines([std("a", 1)]);
    expect(r.totalCents).toBe(3500);
    expect(r.chargeLines).toEqual([{ variantId: "a", unitAmountCents: 3500, quantity: 1 }]);
  });

  it("bundles 2x70ml/35€ at 63€", () => {
    const r = priceLines([std("a", 2)]);
    expect(r.totalCents).toBe(6300);
    expect(chargedTotal(r)).toBe(6300);
  });

  it("bundles 3x70ml/35€ at 84€", () => {
    const r = priceLines([std("a", 3)]);
    expect(r.totalCents).toBe(8400);
    expect(chargedTotal(r)).toBe(8400);
  });

  it("bundles 4x as 3-pack + single (84+35=119€)", () => {
    const r = priceLines([std("a", 4)]);
    expect(r.totalCents).toBe(11900);
    expect(chargedTotal(r)).toBe(11900);
  });

  it("groups standard units across variants (2+1 = 3-pack at 84€)", () => {
    const r = priceLines([std("a", 2), std("b", 1)]);
    expect(r.totalCents).toBe(8400);
    expect(chargedTotal(r)).toBe(8400);
  });

  it("leaves non-standard items at face value", () => {
    const r = priceLines([other("x", 79, 2)]);
    expect(r.totalCents).toBe(15800);
    expect(chargedTotal(r)).toBe(15800);
  });

  it("mixes bundles with non-standard items", () => {
    const r = priceLines([std("a", 2), other("x", 79, 1)]);
    expect(r.totalCents).toBe(6300 + 7900);
    expect(chargedTotal(r)).toBe(r.totalCents);
  });

  it("charged lines always sum exactly to the total", () => {
    const r = priceLines([std("a", 2), std("b", 2), std("c", 1), other("x", 45.5, 3)]);
    expect(chargedTotal(r)).toBe(r.totalCents);
  });
});

describe("priceLines with coupon", () => {
  it("applies SILLAGE2 (10%) after bundling: 2x70ml 63€ → 56.70€", () => {
    const r = priceLines([std("a", 2)], "SILLAGE2");
    expect(r.appliedCoupon).toBe("SILLAGE2");
    expect(r.totalCents).toBe(5670);
    expect(r.subtotalCents).toBe(6300);
    expect(r.discountCents).toBe(630);
    expect(chargedTotal(r)).toBe(5670);
  });

  it("ignores unknown coupon codes", () => {
    const r = priceLines([std("a", 1)], "NOPE");
    expect(r.appliedCoupon).toBeNull();
    expect(r.totalCents).toBe(3500);
  });
});

describe("expectedTotalCents", () => {
  it("matches priceLines total", () => {
    const lines = [std("a", 3), other("x", 79, 1)];
    expect(expectedTotalCents(lines)).toBe(priceLines(lines).totalCents);
    expect(expectedTotalCents(lines, "SILLAGE2")).toBe(priceLines(lines, "SILLAGE2").totalCents);
  });
});
