import "server-only";
import productsData from "./data/products.json";
import brandsData from "./data/brands.json";
import type { Product, Brand } from "@/types";

const products = productsData as Product[];
const brands = brandsData as Brand[];

export function getProducts(family?: string): Product[] {
  if (family && family !== "Todos") {
    return products.filter((p) => p.family.toLowerCase().includes(family.toLowerCase()));
  }
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getVariant(productId: string, variantId: string) {
  const product = getProductById(productId);
  if (!product) return null;
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  return { product, variant };
}

export function getFeaturedProducts(count = 8): Product[] {
  const featured = products.filter((p) => p.badge === "top_ventas");
  if (featured.length >= count) return featured.slice(0, count);
  return products.slice(0, count);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.badge === "nuevo");
}

/**
 * Returns products that are NOT featured (top_ventas), so the "Descubre más"
 * carousel always shows a distinct set from the Featured carousel.
 */
export function getDiscoverProducts(count = 8): Product[] {
  const nonFeatured = products.filter((p) => p.badge !== "top_ventas");
  if (nonFeatured.length >= count) return nonFeatured.slice(0, count);
  // fallback: fill with remaining products if not enough non-featured
  const featured = products.filter((p) => p.badge === "top_ventas");
  return [...nonFeatured, ...featured].slice(0, count);
}

export function getBrands(): Brand[] {
  return brands;
}

/**
 * Normalize a string for accent-insensitive search.
 * - Lowercase
 * - Strip diacritics (NFD decomposition + remove combining marks)
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Search products by name, brand, family, description, or any note (top/heart/base).
 * Accent-insensitive: "Jazmín", "jasmin", "JASMÍN" all match.
 */
export function searchProducts(query: string, limit = 12): Product[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];

  return products
    .filter((p) => {
      const haystack = [
        p.name,
        p.brand,
        p.family,
        p.shortDescription,
        ...p.notes.top,
        ...p.notes.heart,
        ...p.notes.base,
      ]
        .map(normalize)
        .join(" | ");
      return haystack.includes(q);
    })
    .slice(0, limit);
}
