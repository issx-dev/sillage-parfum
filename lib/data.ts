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

export function getFeaturedProducts(count = 8): Product[] {
  const featured = products.filter((p) => p.badge === "top_ventas");
  if (featured.length >= count) return featured.slice(0, count);
  return products.slice(0, count);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.badge === "nuevo");
}

export function getBrands(): Brand[] {
  return brands;
}

export function getFamilies(): string[] {
  let families = Array.from(new Set(products.map((p) => p.family)));
  // Normalize families
  families = families.map((f) => {
    if (f.includes("Amaderado")) return "Amaderados";
    if (f.includes("Oriental")) return "Orientales";
    if (f.includes("Floral")) return "Florales";
    if (f.includes("Fresco")) return "Frescos";
    if (f.includes("Gourmand")) return "Gourmands";
    if (f.includes("Acuático") || f.includes("Acuatico")) return "Frescos";
    if (f.includes("Chipre")) return "Chipre";
    return f;
  });
  return Array.from(new Set(families));
}
