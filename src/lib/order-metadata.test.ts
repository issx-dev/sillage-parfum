import { describe, it, expect } from "vitest";
import { encodeItemsMetadata, decodeItemsMetadata } from "./order-metadata";

describe("order metadata chunking", () => {
  it("round-trips carts larger than Stripe's 500-char value limit", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      productId: `product-${i}`, variantId: `variant-${i}-100`, sku: `SKU-${i}-100`, quantity: i + 1,
    }));
    const meta = encodeItemsMetadata(items);
    expect(Object.keys(meta).length).toBeGreaterThan(1);
    expect(Object.values(meta).every((v) => v.length <= 500)).toBe(true);
    expect(JSON.parse(decodeItemsMetadata(meta)!)).toEqual(items);
  });

  it("reads legacy single-key metadata and returns undefined when absent", () => {
    expect(decodeItemsMetadata({ items: "[]" })).toBe("[]");
    expect(decodeItemsMetadata({})).toBeUndefined();
    expect(decodeItemsMetadata(null)).toBeUndefined();
  });
});
