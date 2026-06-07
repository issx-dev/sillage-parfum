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
  const [intPart, decPart = ""] = abs.toFixed(2).split(".");
  const intWithThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${intWithThousands},${decPart} €`;
}

export function formatSessionId(sessionId: string): string {
  return sessionId.slice(0, 14).toUpperCase();
}
