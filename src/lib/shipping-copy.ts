import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/constants";

/**
 * Customer-facing shipping copy in one place, so the promo bar, product page,
 * metadata and legal text never contradict each other or the real charge
 * (`getShippingCents` in src/lib/utils.ts).
 */
export const DELIVERY_TIME = "24 a 72 h";
export const SHIPPING_SUMMARY = `Envío ${SHIPPING_COST} €, gratis desde ${FREE_SHIPPING_THRESHOLD} €`;
export const SHIPPING_AREA = "Solo enviamos a la península (sin Baleares, Canarias, Ceuta ni Melilla).";
export const SHIPPING_META = `Envío a la península en ${DELIVERY_TIME}, gratis desde ${FREE_SHIPPING_THRESHOLD} €.`;
