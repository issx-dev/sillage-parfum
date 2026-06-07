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
  // NOTE on string matchers:
  //  - es-ES uses a NON-BREAKING SPACE (U+00A0) between the number and "€".
  //    We use a regex with \s to match either regular space or NBSP.
  //  - The runtime's Intl uses small-ICU data, so thousand separators may be
  //    omitted on systems without full ICU. We assert the parts we can
  //    guarantee: currency symbol, decimal comma, and sign.

  it("formats a positive integer as EUR with es-ES locale (comma decimals, trailing €)", () => {
    // 65 -> "65,00 €" (NBSP before €)
    expect(formatPrice(65)).toMatch(/^65,00\s€$/);
  });

  it("formats decimals correctly", () => {
    expect(formatPrice(65.5)).toMatch(/^65,50\s€$/);
    expect(formatPrice(79.99)).toMatch(/^79,99\s€$/);
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toMatch(/^0,00\s€$/);
  });

  it("formats negative numbers with a minus sign", () => {
    expect(formatPrice(-10)).toMatch(/^-10,00\s€$/);
  });

  it("includes the EUR currency symbol and locale-specific decimal separator", () => {
    const out = formatPrice(1234.5);
    expect(out).toContain("€");
    // Decimal part must always be a comma (es-ES), never a period.
    expect(out).toMatch(/,50/);
    // Total amount begins with the integer (sign-aware).
    expect(out).toMatch(/^-?1234/);
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
