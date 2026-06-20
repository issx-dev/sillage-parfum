import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  _hasHydrated: boolean;
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  setHasHydrated: (state: boolean) => void;
}

function isWishlistItem(item: unknown): item is string {
  return typeof item === "string" && item.length > 0;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      _hasHydrated: false,

      toggle: (productId) => {
        set((state) => {
          const exists = state.productIds.includes(productId);
          if (exists) {
            return { productIds: state.productIds.filter((id) => id !== productId) };
          }
          return { productIds: [...state.productIds, productId] };
        });
      },

      isWishlisted: (productId) => {
        return get().productIds.includes(productId);
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "sillage-wishlist",
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        if (
          typeof persistedState !== "object" ||
          persistedState === null
        ) {
          return { productIds: [], _hasHydrated: false } as unknown as WishlistStore;
        }
        const ps = persistedState as Record<string, unknown>;
        if (!Array.isArray(ps.productIds)) {
          return { productIds: [], _hasHydrated: false } as unknown as WishlistStore;
        }
        // Validate each ID with the type guard
        const validIds = (ps.productIds as unknown[]).filter(isWishlistItem);
        return {
          ...ps,
          productIds: validIds,
        } as unknown as WishlistStore;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Multi-tab sync: listen for storage events from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "sillage-wishlist") {
      useWishlistStore.persist.rehydrate();
    }
  });
}