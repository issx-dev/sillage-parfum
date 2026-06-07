import { describe, it, expect } from "vitest";
import { cn, formatPrice, formatSessionId } from "./utils";

describe("cn (className merger)", () => {
  it("joins truthy strings with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values (false, null, undefined, 0, '')", () => {
    expect(cn("foo", false, null, undefined, 0, "", "bar")).toBe("foo bar");
  });

  it("supports object syntax from clsx", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });

  it("supports array syntax from clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("merges conflicting tailwind classes (last-wins via tailwind-merge)", () => {
    // p-2 and p-4 are conflicting padding utilities — the last one wins.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting tailwind classes together", () => {
    const result = cn("p-2", "m-4", "text-red-500");
    expect(result).toContain("p-2");
    expect(result).toContain("m-4");
    expect(result).toContain("text-red-500");
  });
});

describe("formatPrice", () => {
  // The formatter is manual (not Intl-based) to guarantee byte-identical
  // output on Node (small-icu) and the browser (full-icu), so the value
  // can be safely used in JSX without hydration mismatches.
  // Expected shape: "<sign?><intWithDots>,<2dec> €" (single regular space).

  it("formats a positive integer with two-decimal padding", () => {
    expect(formatPrice(65)).toBe("65,00 €");
  });

  it("formats decimals correctly with a comma separator", () => {
    expect(formatPrice(65.5)).toBe("65,50 €");
    expect(formatPrice(79.99)).toBe("79,99 €");
  });

  it("formats zero as '0,00 €'", () => {
    expect(formatPrice(0)).toBe("0,00 €");
  });

  it("formats negative numbers with a leading minus sign", () => {
    expect(formatPrice(-10)).toBe("-10,00 €");
  });

  it("inserts a thousands dot separator for four-digit integers", () => {
    expect(formatPrice(1234.5)).toBe("1.234,50 €");
  });

  it("inserts a thousands dot separator for five- and six-digit numbers", () => {
    expect(formatPrice(12345)).toBe("12.345,00 €");
    expect(formatPrice(123456)).toBe("123.456,00 €");
  });

  it("keeps the sign before the thousands separator for negatives", () => {
    expect(formatPrice(-1234.5)).toBe("-1.234,50 €");
  });

  it("uses a regular space before €, never a non-breaking space", () => {
    expect(formatPrice(65)).not.toMatch(/\u00a0/);
  });
});

describe("formatSessionId", () => {
  it("truncates to 14 characters and uppercases", () => {
    expect(formatSessionId("cs_test_a1b2c3d4e5f6g7h8i9j0")).toBe("CS_TEST_A1B2C3");
  });

  it("uppercases without truncating when input is shorter than 14", () => {
    expect(formatSessionId("short")).toBe("SHORT");
  });

  it("returns an empty string for an empty input", () => {
    expect(formatSessionId("")).toBe("");
  });

  it("returns the full string uppercased when input is exactly 14 chars", () => {
    const fourteen = "abcdefghijklmn";
    expect(formatSessionId(fourteen)).toBe("ABCDEFGHIJKLMN");
    expect(formatSessionId(fourteen)).toHaveLength(14);
  });

  it("treats an input longer than 14 chars as needing truncation", () => {
    const fifteen = "abcdefghijklmno";
    const result = formatSessionId(fifteen);
    expect(result).toHaveLength(14);
    expect(result).toBe("ABCDEFGHIJKLMN");
  });
});
