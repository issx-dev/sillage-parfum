// Types
export type BadgeType = "nuevo" | "oferta" | "top_ventas" | null;

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
  status: "created" | "paid" | "failed";
  customerEmail?: string;
  createdAt: string;
}

// Type guard
export function isProduct(obj: unknown): obj is Product {
  if (typeof obj !== "object" || obj === null) return false;
  const p = obj as Product;
  return (
    typeof p.id === "string" &&
    typeof p.slug === "string" &&
    typeof p.name === "string" &&
    Array.isArray(p.variants)
  );
}
