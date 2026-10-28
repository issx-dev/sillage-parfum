"use client";

import toast from "react-hot-toast";
import { useCartStore, type CartSyncSummary } from "@/store/cartStore";
import type { CartSyncEntry } from "@/types";

let inFlight: Promise<CartSyncSummary | null> | null = null;

/**
 * Refresh the local cart from the database (source of truth). Updates prices,
 * names and images, clamps quantities to stock and drops unavailable lines.
 * Returns null if the request failed (cart left untouched).
 */
export function syncCart({ notify = true }: { notify?: boolean } = {}): Promise<CartSyncSummary | null> {
  if (inFlight) return inFlight;

  const { items } = useCartStore.getState();
  if (items.length === 0) return Promise.resolve({ changed: false, removed: [], repriced: [], reduced: [] });

  inFlight = (async () => {
    try {
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds: items.map((i) => i.variantId) }),
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { items: CartSyncEntry[] };
      const summary = useCartStore.getState().applyServerState(data.items);
      if (notify && summary.changed) {
        if (summary.removed.length) toast.error(`Ya no disponible y retirado del carrito: ${summary.removed.join(", ")}`);
        if (summary.reduced.length) toast.error(`Cantidad ajustada al stock: ${summary.reduced.join(", ")}`);
        if (summary.repriced.length) toast(`Precio actualizado: ${summary.repriced.join(", ")}`);
      }
      return summary;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
