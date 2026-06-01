import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  _hasHydrated: boolean;
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  setHasHydrated: (state: boolean) => void;
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
