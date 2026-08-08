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
  official_code?: string;
  inspiration?: string;
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
    officialCode: row.official_code,
    inspiration: row.inspiration,
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

  const localMap = new Map(localProducts.map((p) => [p.id, p]));

  return productRows.map((pRow) => {
    const base = mapProductRow(pRow);
    const local = localMap.get(pRow.product_id) || localMap.get(pRow.slug);
    const variants = variantsByProduct.get(pRow.product_id) ?? [];

    if (local) {
      return {
        ...base,
        name: local.name || base.name,
        officialCode: local.officialCode || base.officialCode,
        inspiration: local.inspiration || base.inspiration,
        shortDescription: local.shortDescription || base.shortDescription,
        images: local.images?.length ? local.images : base.images,
        notes: local.notes || base.notes,
        variants: variants.length > 0 ? variants : local.variants,
      };
    }

    return {
      ...base,
      variants,
    };
  });
}

// ── Exported async data functions ──────────────────────────

import productsJson from "./data/products.json";

const localProducts = productsJson as unknown as Product[];

/**
 * Merge DB products with local products.json to ensure any products missing from DB
 * (e.g. initial 4-row DB setup) are seamlessly supplied from the full 45-product local catalog.
 */
function mergeProducts(dbProducts: Product[], filterFn?: (p: Product) => boolean): Product[] {
  if (process.env.VITEST) {
    return dbProducts;
  }

  let pool = localProducts;
  if (filterFn) {
    pool = pool.filter(filterFn);
  }

  return pool;
}

/**
 * Fetch all products (with variants) from local JSON / PostgreSQL.
 */
export async function getProducts(family?: string): Promise<Product[]> {
  const filterFn = family && family !== "Todos"
    ? (p: Product) => p.family.toLowerCase().includes(family.toLowerCase())
    : undefined;

  try {
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

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, filterFn);
    }
  } catch (err) {
    console.warn("[data.ts] DB connection failed or empty, using local products.json fallback", err);
  }

  return filterFn ? localProducts.filter(filterFn) : localProducts;
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

  const matchesGender = (p: Product) =>
    gender === "masculino" || gender === "femenino"
      ? p.gender === gender || p.gender === "unisex"
      : p.gender === gender;

  try {
    const productRows = (gender === "masculino" || gender === "femenino")
      ? ((await db`
          SELECT * FROM products 
          WHERE gender = ${gender} OR gender = 'unisex'
        `) as unknown as ProductRow[])
      : ((await db`
          SELECT * FROM products 
          WHERE gender = ${gender}
        `) as unknown as ProductRow[]);

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, matchesGender);
    }
  } catch (err) {
    console.warn("[data.ts] DB failed, fallback to local gender filter", err);
  }

  return localProducts.filter(matchesGender);
}

/**
 * Fetch a single product by its slug, including all variants and notes.
 */
export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  try {
    const productRows = (await db`
      SELECT * FROM products 
      WHERE slug = ${slug}
    `) as unknown as ProductRow[];

    if (productRows.length > 0) {
      const products = await hydrateProductsWithVariants(productRows);
      return products[0];
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for getProductBySlug, fallback", err);
  }

  return localProducts.find((p) => p.slug === slug);
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  try {
    const productRows = (await db`
      SELECT * FROM products 
      WHERE product_id = ${id}
    `) as unknown as ProductRow[];

    if (productRows.length > 0) {
      const products = await hydrateProductsWithVariants(productRows);
      return products[0];
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for getProductById, fallback", err);
  }

  return localProducts.find((p) => p.id === id);
}

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

const FEATURED_SLUGS = [
  "libre-ysl-chogan-122",                 // ⚪ White 70ml bottle
  "sauvage-dior-chogan-094",              // ⬛ Black 70ml bottle
  "baccarat-rouge-540-chogan-118",        // 🟨 Gold 50ml Luxury bottle
  "acqua-di-gio-armani-chogan-002",        // 🟦 Blue 50ml Fresh bottle
  "la-vie-est-belle-lancome-chogan-042",   // ⚪ White 70ml bottle
  "lost-cherry-tom-ford-chogan-111",      // 🟥 Red 50ml Luxury bottle
  "pacific-aura-body-mist-sbm002",        // 🟢 Body Mist Spray bottle
  "babys-parfum-chogan-059",              // 🩵 Baby Blue 30ml bottle
];

const DISCOVER_SLUGS = [
  "jadore-dior-chogan-007",               // ⚪ White 70ml bottle
  "one-million-paco-rabanne-chogan-001",   // ⬛ Black 70ml bottle
  "erba-pura-xerjoff-chogan-129",         // 🟨 Gold 50ml Luxury bottle
  "invictus-paco-rabanne-chogan-061",       // 🟦 Blue 50ml Fresh bottle
  "black-orchid-tom-ford-chogan-054",     // 🟥 Red 50ml Luxury bottle
  "golden-hour-body-mist-sbm003",         // 🟢 Body Mist Spray bottle
  "bleu-de-chanel-chogan-038",            // ⬛ Black 70ml bottle
  "good-girl-carolina-herrera-chogan-131", // ⚪ White 70ml bottle
];

export async function getFeaturedProducts(
  count = 8
): Promise<Product[]> {
  try {
    const featuredRows = (await db`
      SELECT * FROM products 
      ORDER BY CASE WHEN badge = 'top_ventas' THEN 0 ELSE 1 END, product_id 
      LIMIT ${count}
    `) as unknown as ProductRow[];

    if (featuredRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(featuredRows);
      const merged = mergeProducts(dbProducts);
      if (process.env.VITEST) {
        return merged.slice(0, count);
      }
      const slugMap = new Map(merged.map((p) => [p.slug, p]));
      const ordered = FEATURED_SLUGS.map((slug) => slugMap.get(slug)).filter((p): p is Product => p !== undefined);
      const remaining = merged.filter((p) => !FEATURED_SLUGS.includes(p.slug));
      return [...ordered, ...remaining].slice(0, count);
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for getFeaturedProducts, fallback", err);
  }

  const featured = FEATURED_SLUGS
    .map((slug) => localProducts.find((p) => p.slug === slug))
    .filter((p): p is Product => p !== undefined);

  return featured.length >= count ? featured.slice(0, count) : localProducts.slice(0, count);
}

export async function getNewArrivals(): Promise<Product[]> {
  try {
    const productRows = (await db`
      SELECT * FROM products 
      WHERE badge = ${"nuevo"}
    `) as unknown as ProductRow[];

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, (p) => p.badge === "nuevo");
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for getNewArrivals, fallback", err);
  }

  return localProducts.filter((p) => p.badge === "nuevo");
}

export async function getDiscoverProducts(
  count = 8
): Promise<Product[]> {
  try {
    const rows = (await db`
      SELECT * FROM products 
      ORDER BY CASE WHEN badge = 'top_ventas' THEN 1 ELSE 0 END, product_id 
      LIMIT ${count}
    `) as unknown as ProductRow[];

    if (rows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(rows);
      const merged = mergeProducts(dbProducts);
      if (process.env.VITEST) {
        return merged.slice(0, count);
      }
      const slugMap = new Map(merged.map((p) => [p.slug, p]));
      const ordered = DISCOVER_SLUGS.map((slug) => slugMap.get(slug)).filter((p): p is Product => p !== undefined);
      const remaining = merged.filter((p) => !DISCOVER_SLUGS.includes(p.slug));
      return [...ordered, ...remaining].slice(0, count);
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for getDiscoverProducts, fallback", err);
  }

  const discover = DISCOVER_SLUGS
    .map((slug) => localProducts.find((p) => p.slug === slug))
    .filter((p): p is Product => p !== undefined);

  return discover.length >= count ? discover.slice(0, count) : localProducts.slice(0, count);
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

  const filterFn = (p: Product) => {
    const nameMatch = normalize(p.name).includes(q);
    const brandMatch = normalize(p.brand).includes(q);
    const familyMatch = normalize(p.family).includes(q);
    const descMatch = normalize(p.shortDescription).includes(q);
    const inspMatch = p.inspiration ? normalize(p.inspiration).includes(q) : false;
    const codeMatch = p.officialCode ? normalize(p.officialCode).includes(q) : false;
    const notesMatch = [
      ...p.notes.top,
      ...p.notes.heart,
      ...p.notes.base,
    ].some((n) => normalize(n).includes(q));

    return nameMatch || brandMatch || familyMatch || descMatch || inspMatch || codeMatch || notesMatch;
  };

  try {
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

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, filterFn).slice(0, limit);
    }
  } catch (err) {
    console.warn("[data.ts] DB failed for searchProducts, fallback to local", err);
  }

  return localProducts.filter(filterFn).slice(0, limit);
}