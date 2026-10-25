import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartSyncEntry } from "@/types";
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
  getItemCount: () => number;
  getFreeShippingRemaining: () => number;
  applyServerState: (entries: CartSyncEntry[]) => CartSyncSummary;
  setHasHydrated: (state: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export interface CartSyncSummary {
  changed: boolean;
  removed: string[]; // names of lines dropped (gone or out of stock)
  repriced: string[]; // names whose price changed
  reduced: string[]; // names whose quantity was cut to the available stock
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

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getFreeShippingRemaining: () => {
        return Math.max(0, FREE_SHIPPING_THRESHOLD - get().getTotal());
      },

      applyServerState: (entries) => {
        const summary: CartSyncSummary = { changed: false, removed: [], repriced: [], reduced: [] };
        const byId = new Map(entries.map((e) => [e.variantId, e]));
        const next: CartItem[] = [];

        for (const item of get().items) {
          const entry = byId.get(item.variantId);
          if (!entry) {
            next.push(item); // not part of this sync response; keep as is
            continue;
          }
          if (!entry.available || entry.stock <= 0) {
            summary.removed.push(item.name);
            continue;
          }
          const quantity = Math.min(item.quantity, entry.stock);
          if (quantity !== item.quantity) summary.reduced.push(entry.name);
          if (entry.price !== item.price) summary.repriced.push(entry.name);
          next.push({
            ...item,
            productId: entry.productId,
            slug: entry.slug,
            name: entry.name,
            brand: entry.brand,
            image: entry.image,
            size_ml: entry.size_ml,
            price: entry.price,
            quantity,
          });
        }

        summary.changed =
          summary.removed.length + summary.repriced.length + summary.reduced.length > 0;
        if (JSON.stringify(next) !== JSON.stringify(get().items)) set({ items: next });
        return summary;
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