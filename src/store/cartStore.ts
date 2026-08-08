import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  isCartOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getDiscountedTotal: () => number;
  getSavings: () => number;
  getItemCount: () => number;
  getFreeShippingRemaining: () => number;
  setHasHydrated: (state: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

function isCartItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null) return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.variantId === "string" &&
    typeof c.productId === "string" &&
    typeof c.name === "string" &&
    typeof c.price === "number" &&
    typeof c.quantity === "number"
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      isCartOpen: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      /**
       * Multi-buy offer logic for Chogan 70ml perfumes:
       * 1 unit = 35€
       * 2 units = 63€ (save 7€)
       * 3 units = 84€ (save 21€)
       */
      getDiscountedTotal: () => {
        const items = get().items;

        // Group 70ml standard perfumes (35€ base price)
        const standard70mlItems = items.filter((i) => i.size_ml === 70 && i.price === 35);
        const otherItems = items.filter((i) => !(i.size_ml === 70 && i.price === 35));

        // Count total quantity of 70ml 35€ perfumes
        const total70mlQty = standard70mlItems.reduce((acc, item) => acc + item.quantity, 0);

        // Apply bundles of 3 (84€ per pack of 3)
        const packsOf3 = Math.floor(total70mlQty / 3);
        const remainderAfter3 = total70mlQty % 3;

        // Apply bundles of 2 (63€ per pack of 2)
        const packsOf2 = Math.floor(remainderAfter3 / 2);
        const singles = remainderAfter3 % 2;

        const bundle70mlTotal = (packsOf3 * 84) + (packsOf2 * 63) + (singles * 35);
        const otherTotal = otherItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return bundle70mlTotal + otherTotal;
      },

      getSavings: () => {
        return get().getTotal() - get().getDiscountedTotal();
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getFreeShippingRemaining: () => {
        return Math.max(0, FREE_SHIPPING_THRESHOLD - get().getTotal());
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: "sillage-cart",
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        if (
          typeof persistedState !== "object" ||
          persistedState === null
        ) {
          return { items: [], isCartOpen: false, _hasHydrated: false } as unknown as CartStore;
        }
        const ps = persistedState as Record<string, unknown>;
        if (!Array.isArray(ps.items)) {
          return { items: [], isCartOpen: false, _hasHydrated: false } as unknown as CartStore;
        }
        // Validate each item with the type guard
        const validItems = (ps.items as unknown[]).filter(isCartItem);
        return {
          ...ps,
          items: validItems,
        } as unknown as CartStore;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        items: state.items,
        // isCartOpen is NOT persisted — cart always starts closed
      }),
    }
  )
);

// Multi-tab sync: listen for storage events from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "sillage-cart") {
      useCartStore.persist.rehydrate();
    }
  });
}