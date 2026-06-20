import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, type CartStore } from "./cartStore";
import type { CartItem } from "@/types";

// Test fixture: a minimal but realistic CartItem.
const itemA: CartItem = {
  variantId: "sauvage-050",
  productId: "sauvage-dior",
  slug: "sauvage-dior-edt",
  name: "Sauvage Dior EDT",
  brand: "Dior",
  image: "/images/products/sauvage-dior-front.jpg",
  size_ml: 50,
  price: 79,
  quantity: 1,
};

const itemB: CartItem = {
  variantId: "chn5-100",
  productId: "chanel-5",
  slug: "chanel-5-edp",
  name: "Chanel No5 EDP",
  brand: "Chanel",
  image: "/images/products/chanel-5-front.jpg",
  size_ml: 100,
  price: 135,
  quantity: 2,
};

const itemADiffQty: CartItem = { ...itemA, quantity: 3 };

function resetStore() {
  // Wipe persisted storage and reset the in-memory store.
  localStorage.clear();
  useCartStore.setState({
    items: [],
    _hasHydrated: false,
    isCartOpen: false,
  } as Partial<CartStore>);
}

describe("cartStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("addItem", () => {
    it("creates a new entry with quantity 1 when variantId is new", () => {
      useCartStore.getState().addItem(itemA);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0]!.variantId).toBe("sauvage-050");
      expect(items[0]!.quantity).toBe(1);
    });

    it("increments quantity of an existing variantId by the added item's quantity", () => {
      useCartStore.getState().addItem(itemA); // quantity 1
      useCartStore.getState().addItem(itemADiffQty); // quantity 3
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0]!.variantId).toBe("sauvage-050");
      expect(items[0]!.quantity).toBe(4); // 1 + 3
    });

    it("adds distinct variantIds as separate items", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().addItem(itemB);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.variantId).sort()).toEqual([
        "chn5-100",
        "sauvage-050",
      ]);
    });
  });

  describe("removeItem", () => {
    it("removes an item by variantId", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().addItem(itemB);
      useCartStore.getState().removeItem("sauvage-050");
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0]!.variantId).toBe("chn5-100");
    });

    it("is a no-op when variantId is not in the cart", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().removeItem("does-not-exist");
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
    });
  });

  describe("updateQuantity", () => {
    it("updates the quantity for the matching variantId", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().updateQuantity("sauvage-050", 5);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0]!.quantity).toBe(5);
    });

    it("removes the item when quantity is 0 or negative", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().updateQuantity("sauvage-050", 0);
      expect(useCartStore.getState().items).toHaveLength(0);

      useCartStore.getState().addItem(itemA);
      useCartStore.getState().updateQuantity("sauvage-050", -2);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("is a no-op for a non-existent variantId", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().updateQuantity("nope", 99);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0]!.quantity).toBe(1);
    });
  });

  describe("clearCart", () => {
    it("empties the items array", () => {
      useCartStore.getState().addItem(itemA);
      useCartStore.getState().addItem(itemB);
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe("getTotal", () => {
    it("returns 0 for an empty cart", () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it("sums price * quantity across items", () => {
      useCartStore.getState().addItem(itemA); // 79 * 1
      useCartStore.getState().addItem(itemB); // 135 * 2
      expect(useCartStore.getState().getTotal()).toBe(79 + 135 * 2);
    });
  });

  describe("getItemCount", () => {
    it("returns the total number of units (sum of quantities)", () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
      useCartStore.getState().addItem(itemA); // 1
      useCartStore.getState().addItem(itemB); // 2
      expect(useCartStore.getState().getItemCount()).toBe(3);
    });
  });

  describe("getFreeShippingRemaining", () => {
    it("returns the full threshold for an empty cart", () => {
      expect(useCartStore.getState().getFreeShippingRemaining()).toBe(50);
    });

    it("decreases as the cart total grows", () => {
      useCartStore.getState().addItem(itemA); // total 79
      // 79 >= 50 => 0 remaining
      expect(useCartStore.getState().getFreeShippingRemaining()).toBe(0);
    });

    it("returns the leftover for carts below the threshold", () => {
      // Add an item that totals less than 50. Light Blue 30ml is 42.
      const lightBlue: CartItem = { ...itemA, variantId: "lb-030", productId: "light-blue-dg", price: 42 };
      useCartStore.getState().addItem(lightBlue);
      expect(useCartStore.getState().getFreeShippingRemaining()).toBe(8);
    });
  });

  describe("cart open/close", () => {
    it("toggles isCartOpen", () => {
      expect(useCartStore.getState().isCartOpen).toBe(false);
      useCartStore.getState().openCart();
      expect(useCartStore.getState().isCartOpen).toBe(true);
      useCartStore.getState().closeCart();
      expect(useCartStore.getState().isCartOpen).toBe(false);
      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isCartOpen).toBe(true);
    });
  });

  describe("localStorage persistence", () => {
    it("writes items to localStorage under the expected key", async () => {
      useCartStore.getState().addItem(itemA);
      // Allow the persist middleware's debounced write to flush.
      await new Promise((r) => setTimeout(r, 0));
      const raw = localStorage.getItem("sillage-cart");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.items).toHaveLength(1);
      expect(parsed.state.items[0].variantId).toBe("sauvage-050");
    });

    it("rehydrates items from localStorage on store init", async () => {
      // Pre-seed localStorage as if a previous session left items behind.
      const seeded = {
        state: { items: [itemA, itemB] },
        version: 0,
      };
      localStorage.setItem("sillage-cart", JSON.stringify(seeded));

      // Re-create the store from the same persisted state by rehydrating.
      // (The store is a module-level singleton, so we re-run the rehydrate
      // call manually by calling setHasHydrated — the real hydration happens
      // when the module first loads, which already happened at import time.
      // To prove the rehydration pipeline, we assert that localStorage data
      // matches the expected shape and the store can read it via setState.)
      useCartStore.persist.rehydrate();
      // Wait a tick for async rehydration to complete.
      await new Promise((r) => setTimeout(r, 0));

      const { items } = useCartStore.getState();
      // After rehydrate, items should contain what we seeded.
      // (The store may also have run addItem from earlier tests; beforeEach
      // reset it to []. The rehydrate should overwrite with seeded data.)
      expect(items.length).toBeGreaterThanOrEqual(2);
      const variantIds = items.map((i) => i.variantId);
      expect(variantIds).toContain("sauvage-050");
      expect(variantIds).toContain("chn5-100");
    });
  });
});
