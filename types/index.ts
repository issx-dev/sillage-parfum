// Types
export type BadgeType = "nuevo" | "oferta" | "top_ventas" | null;
export type Gender = "masculino" | "femenino" | "unisex";

export interface Variant {
  id: string;
  size_ml: number;
  price: number;
  stock: number;
  sku: string;
}

export interface OlfactoryNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  family: string;
  gender: Gender;
  shortDescription: string;
  badge: BadgeType;
  images: string[];
  variants: Variant[];
  discount_percent: number;
  notes: OlfactoryNotes;
}

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  size_ml: number;
  price: number;
  quantity: number;
}

export interface Brand {
  id: string;
  name: string;
  logo_slug: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  /** Payment status derived from Stripe webhook events. */
  status: "paid" | "refunded" | "failed";
  customerEmail?: string;
  createdAt: string;
  stripe_event_id: string;
}

// Type guard
export function isProduct(obj: unknown): obj is Product {
  if (typeof obj !== "object" || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.slug === "string" &&
    typeof p.name === "string" &&
    typeof p.brand === "string" &&
    typeof p.family === "string" &&
    (p.gender === "masculino" || p.gender === "femenino" || p.gender === "unisex") &&
    typeof p.shortDescription === "string" &&
    (p.badge === "nuevo" || p.badge === "oferta" || p.badge === "top_ventas" || p.badge === null || p.badge === undefined) &&
    Array.isArray(p.images) &&
    Array.isArray(p.variants) &&
    typeof p.discount_percent === "number" &&
    typeof p.notes === "object" && p.notes !== null &&
    Array.isArray((p.notes as Record<string, unknown>).top) &&
    Array.isArray((p.notes as Record<string, unknown>).heart) &&
    Array.isArray((p.notes as Record<string, unknown>).base)
  );
}
