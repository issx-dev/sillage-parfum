import { describe, it, expect, beforeEach } from "vitest";
import { useWishlistStore } from "./wishlistStore";

function resetStore() {
  localStorage.clear();
  useWishlistStore.setState({
    productIds: [],
    _hasHydrated: false,
  });
}

describe("wishlistStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("toggle", () => {
    it("adds the productId when it is not present", () => {
      expect(useWishlistStore.getState().productIds).toEqual([]);
      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().productIds).toEqual(["chanel-5"]);
    });

    it("removes the productId when it is already present", () => {
      useWishlistStore.getState().toggle("chanel-5");
      useWishlistStore.getState().toggle("sauvage-dior");
      expect(useWishlistStore.getState().productIds.sort()).toEqual([
        "chanel-5",
        "sauvage-dior",
      ]);

      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().productIds).toEqual(["sauvage-dior"]);
    });

    it("is idempotent in a two-step add/remove cycle (ends empty)", () => {
      useWishlistStore.getState().toggle("chanel-5");
      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().productIds).toEqual([]);
    });

    it("supports multiple distinct productIds", () => {
      ["chanel-5", "sauvage-dior", "acqua-di-gio", "baccarat-rouge"].forEach(
        (id) => useWishlistStore.getState().toggle(id)
      );
      expect(useWishlistStore.getState().productIds).toHaveLength(4);
    });
  });

  describe("isWishlisted", () => {
    it("returns false for a productId not in the list", () => {
      expect(useWishlistStore.getState().isWishlisted("chanel-5")).toBe(false);
    });

    it("returns true for a productId that is in the list", () => {
      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().isWishlisted("chanel-5")).toBe(true);
    });

    it("reflects removal (returns false after toggle removes it)", () => {
      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().isWishlisted("chanel-5")).toBe(true);
      useWishlistStore.getState().toggle("chanel-5");
      expect(useWishlistStore.getState().isWishlisted("chanel-5")).toBe(false);
    });
  });

  describe("localStorage persistence", () => {
    it("writes productIds to localStorage under the expected key", async () => {
      useWishlistStore.getState().toggle("chanel-5");
      await new Promise((r) => setTimeout(r, 0));
      const raw = localStorage.getItem("sillage-wishlist");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.productIds).toEqual(["chanel-5"]);
    });

    it("rehydrates productIds from localStorage on store init", async () => {
      const seeded = {
        state: { productIds: ["chanel-5", "sauvage-dior"] },
        version: 0,
      };
      localStorage.setItem("sillage-wishlist", JSON.stringify(seeded));

      useWishlistStore.persist.rehydrate();
      await new Promise((r) => setTimeout(r, 0));

      const ids = useWishlistStore.getState().productIds;
      expect(ids).toContain("chanel-5");
      expect(ids).toContain("sauvage-dior");
    });
  });
});
