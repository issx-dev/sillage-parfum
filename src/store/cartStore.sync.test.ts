import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";
import type { CartItem } from "@/types";

const item = (over: Partial<CartItem> = {}): CartItem => ({
  variantId: "v1", productId: "p1", slug: "p-1", name: "P1", brand: "B",
  image: "", size_ml: 50, price: 90, quantity: 3, ...over,
});

describe("cartStore.applyServerState", () => {
  beforeEach(() => useCartStore.setState({ items: [] }));

  it("updates price from the database and clamps quantity to stock", () => {
    useCartStore.setState({ items: [item()] });
    const summary = useCartStore.getState().applyServerState([
      { variantId: "v1", available: true, productId: "p1", slug: "p-1", name: "P1", brand: "B", image: "", size_ml: 50, price: 100, stock: 2 },
    ]);
    expect(summary).toMatchObject({ changed: true, repriced: ["P1"], reduced: ["P1"], removed: [] });
    expect(useCartStore.getState().items[0]).toMatchObject({ price: 100, quantity: 2 });
  });

  it("removes lines that are gone or out of stock", () => {
    useCartStore.setState({ items: [item(), item({ variantId: "v2", name: "P2" })] });
    const summary = useCartStore.getState().applyServerState([
      { variantId: "v1", available: false },
      { variantId: "v2", available: true, productId: "p1", slug: "s", name: "P2", brand: "B", image: "", size_ml: 50, price: 90, stock: 0 },
    ]);
    expect(summary.removed).toEqual(["P1", "P2"]);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("reports no change when everything matches", () => {
    useCartStore.setState({ items: [item({ quantity: 1 })] });
    const summary = useCartStore.getState().applyServerState([
      { variantId: "v1", available: true, productId: "p1", slug: "p-1", name: "P1", brand: "B", image: "", size_ml: 50, price: 90, stock: 5 },
    ]);
    expect(summary.changed).toBe(false);
  });
});
