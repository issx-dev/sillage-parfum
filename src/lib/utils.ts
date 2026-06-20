import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  // Manual es-ES currency format. We avoid `Intl.NumberFormat` because
  // Node's small-icu runtime lacks the es-ES thousand-separator data,
  // producing "1234,50 €" on the server while the browser (full-icu)
  // produces "1.234,50 €". That divergence is a hydration-mismatch
  // landmine in Next.js. Manual formatting is byte-identical on both
  // sides and decouples us from the runtime's ICU data.
  const sign = price < 0 ? "-" : "";
  const abs = Math.abs(price);
  const parts = abs.toFixed(2).split(".");
  const intPart = parts[0] ?? "0";
  const decPart = parts[1] ?? "00";
  const intWithThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${intWithThousands},${decPart} €`;
}

export function formatSessionId(sessionId: string): string {
  return sessionId.slice(0, 14).toUpperCase();
}

/**
 * Apply a percentage discount to a price.
 * `discountPercent` is clamped to [0, 100]; negative or > 100 falls back
 * to identity (no discount) — never returns a negative price.
 */
export function applyDiscount(price: number, discountPercent: number): number {
  if (!Number.isFinite(price) || price < 0) return 0;
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return price;
  const clamped = Math.min(100, discountPercent);
  // Round to 2 decimals to match the cent precision used everywhere else.
  return Math.round(price * (1 - clamped / 100) * 100) / 100;
}
