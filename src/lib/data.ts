import "server-only";
import { db } from "@/lib/db";
import type { Product, Variant, Gender, BadgeType, Brand } from "@/types";
import brandsData from "./data/brands.json";

const brands = brandsData as Brand[];

// ── DB row interfaces (snake_case columns → camelCase TS) ──

interface ProductRow {
  product_id: string;
  slug: string;
  name: string;
  brand: string;
  family: string;
  gender: string;
  short_description: string;
  badge: string | null;
  images: string[];
  discount_percent: number;
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
}

interface VariantRow {
  variant_id: string;
  product_id: string;
  size_ml: number;
  price: number;
  stock: number;
  sku: string;
}

// ── Row → Type mappers ──────────────────────────────────────

function mapProductRow(row: ProductRow): Omit<Product, "variants"> {
  return {
    id: row.product_id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    family: row.family,
    gender: row.gender as Gender,
    shortDescription: row.short_description,
    badge: (row.badge ?? null) as BadgeType,
    images: row.images,
    discount_percent: row.discount_percent,
    notes: {
      top: row.notes_top,
      heart: row.notes_heart,
      base: row.notes_base,
    },
  };
}

function mapVariantRow(row: VariantRow): Variant {
  return {
    id: row.variant_id,
    size_ml: row.size_ml,
    price: row.price,
    stock: row.stock,
    sku: row.sku,
  };
}

/**
 * Fetch variants for a set of product rows and assemble full Product objects.
 * Queries variants with `WHERE product_id = ANY($1)` in a single round-trip,
 * then groups them by product_id for O(1) attachment.
 */
async function hydrateProductsWithVariants(
  productRows: ProductRow[]
): Promise<Product[]> {
  if (productRows.length === 0) return [];

  const productIds = productRows.map((r) => r.product_id);

  const variantRows = (await db`
    SELECT variant_id, product_id, size_ml, price, stock, sku 
    FROM variants 
    WHERE product_id = ANY(${productIds}) 
    ORDER BY size_ml
  `) as unknown as VariantRow[];

  const variantsByProduct = new Map<string, Variant[]>();
  for (const vRow of variantRows) {
    const existing = variantsByProduct.get(vRow.product_id) ?? [];
    existing.push(mapVariantRow(vRow));
    variantsByProduct.set(vRow.product_id, existing);
  }

  return productRows.map((pRow) => ({
    ...mapProductRow(pRow),
    variants: variantsByProduct.get(pRow.product_id) ?? [],
  }));
}

// ── Exported async data functions ──────────────────────────

/**
 * Fetch all products (with variants) from PostgreSQL.
 * Optionally filter by family using ILIKE (case-insensitive substring match).
 */
export async function getProducts(family?: string): Promise<Product[]> {
  let productRows: ProductRow[];

  if (family && family !== "Todos") {
    productRows = (await db`
      SELECT * FROM products 
      WHERE family ILIKE ${'%' + family + '%'}
    `) as unknown as ProductRow[];
  } else {
    productRows = (await db`
      SELECT * FROM products
    `) as unknown as ProductRow[];
  }

  return hydrateProductsWithVariants(productRows);
}

/**
 * Fetch products filtered by gender.
 * When no gender is provided, returns all products.
 */
export async function getProductsByGender(
  gender?: Gender
): Promise<Product[]> {
  if (!gender) {
    return getProducts();
  }

  const productRows = (await db`
    SELECT * FROM products 
    WHERE gender = ${gender}
  `) as unknown as ProductRow[];

  return hydrateProductsWithVariants(productRows);
}

/**
 * Fetch a single product by its slug, including all variants and notes.
 */
export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const productRows = (await db`
    SELECT * FROM products 
    WHERE slug = ${slug}
  `) as unknown as ProductRow[];

  if (productRows.length === 0) return undefined;

  const products = await hydrateProductsWithVariants(productRows);
  return products[0];
}

/**
 * Fetch a single product by its internal ID (product_id column),
 * including all variants and notes.
 */
export async function getProductById(
  id: string
): Promise<Product | undefined> {
  const productRows = (await db`
    SELECT * FROM products 
    WHERE product_id = ${id}
  `) as unknown as ProductRow[];

  if (productRows.length === 0) return undefined;

  const products = await hydrateProductsWithVariants(productRows);
  return products[0];
}

/**
 * Resolve a product + specific variant by their IDs.
 * Returns null if either the product or variant is not found.
 */
export async function getVariant(
  productId: string,
  variantId: string
): Promise<{ product: Product; variant: Variant } | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  return { product, variant };
}

/**
 * Fetch featured products (badge = 'top_ventas').
 * If fewer than `count` featured products exist, fills remaining slots
 * with other products.
 * Consolidated into a single database query.
 */
export async function getFeaturedProducts(
  count = 8
): Promise<Product[]> {
  const featuredRows = (await db`
    SELECT * FROM products 
    ORDER BY CASE WHEN badge = 'top_ventas' THEN 0 ELSE 1 END, product_id 
    LIMIT ${count}
  `) as unknown as ProductRow[];

  return hydrateProductsWithVariants(featuredRows);
}

/**
 * Fetch new arrival products (badge = 'nuevo').
 */
export async function getNewArrivals(): Promise<Product[]> {
  const productRows = (await db`
    SELECT * FROM products 
    WHERE badge = ${"nuevo"}
  `) as unknown as ProductRow[];

  return hydrateProductsWithVariants(productRows);
}

/**
 * Returns products that are NOT featured (badge !== 'top_ventas'),
 * so the "Descubre mas" carousel always shows a distinct set.
 * If not enough non-featured products exist, fills with featured ones.
 * Consolidated into a single database query.
 */
export async function getDiscoverProducts(
  count = 8
): Promise<Product[]> {
  const rows = (await db`
    SELECT * FROM products 
    ORDER BY CASE WHEN badge = 'top_ventas' THEN 1 ELSE 0 END, product_id 
    LIMIT ${count}
  `) as unknown as ProductRow[];

  return hydrateProductsWithVariants(rows);
}

/**
 * Fetch all brands from static JSON (not yet migrated to DB).
 */
export function getBrands(): Brand[] {
  return brands;
}

// ── Search ─────────────────────────────────────────────────

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
 * Search products by name, brand, family, description, or any note
 * (top/heart/base). Accent-insensitive via query normalization + PostgreSQL ILIKE + unaccent.
 */
export async function searchProducts(
  searchQuery: string,
  limit = 12
): Promise<Product[]> {
  const q = normalize(searchQuery.trim());
  if (q.length < 2) return [];

  const productRows = (await db`
    SELECT * FROM products WHERE
      unaccent(name) ILIKE '%' || ${q} || '%' OR
      unaccent(brand) ILIKE '%' || ${q} || '%' OR
      unaccent(family) ILIKE '%' || ${q} || '%' OR
      unaccent(short_description) ILIKE '%' || ${q} || '%' OR
      unaccent(array_to_string(notes_top, ' ')) ILIKE '%' || ${q} || '%' OR
      unaccent(array_to_string(notes_heart, ' ')) ILIKE '%' || ${q} || '%' OR
      unaccent(array_to_string(notes_base, ' ')) ILIKE '%' || ${q} || '%'
    LIMIT ${limit}
  `) as unknown as ProductRow[];

  return hydrateProductsWithVariants(productRows);
}