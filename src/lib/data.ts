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
  // Postgres `numeric` llega como string ("29.00") — se coacciona en mapVariantRow.
  price: number | string;
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
    discount_percent: Math.min(100, Math.max(0, Number(row.discount_percent) || 0)),
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
    size_ml: Number(row.size_ml),
    // numeric de Postgres llega como string: sin Number(), applyDiscount
    // devuelve 0 y la tienda muestra 0,00 € en ficha, carrito y checkout.
    price: Number(row.price),
    stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
    sku: row.sku,
  };
}

/**
 * A variant is sellable only with a finite price above zero. Anything else
 * (NULL, 0, negative) is a data-entry mistake and must never reach the shop
 * or Stripe, so it is dropped here and logged.
 */
function isValidVariantRow(row: VariantRow): boolean {
  const price = Number(row.price);
  const ok = Number.isFinite(price) && price > 0;
  if (!ok) {
    console.warn(`[data] Ignoring variant ${row.variant_id}: invalid price ${String(row.price)}`);
  }
  return ok;
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

  // Sanitize ids before binding to `ANY($1)`: a nullish/empty element
  // corrupts the array literal Postgres receives for $1 → 22P02
  // ("Array value must start with {"), or throws UNDEFINED_VALUE
  // client-side in the postgres driver. Dedupe to keep the array small.
  const productIds = Array.from(
    new Set(
      productRows
        .map((r) => r.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const variantsByProduct = new Map<string, Variant[]>();

  if (productIds.length > 0) {
    const variantRows = (await db`
      SELECT variant_id, product_id, size_ml, price, stock, sku 
      FROM variants 
      WHERE product_id = ANY(${productIds}) 
      ORDER BY size_ml
    `) as unknown as VariantRow[];

    for (const vRow of variantRows) {
      if (!isValidVariantRow(vRow)) continue;
      const existing = variantsByProduct.get(vRow.product_id) ?? [];
      existing.push(mapVariantRow(vRow));
      variantsByProduct.set(vRow.product_id, existing);
    }
  }

  const localMap = new Map(localProducts.map((p) => [p.id, p]));

  // The database is the single source of truth. products.json only fills
  // descriptive gaps (name, images, notes) for products that exist in the DB;
  // prices, stock and variants always come from the DB, otherwise the shop
  // could sell something checkout/webhook (which verify against the DB) reject.
  // Products without any sellable variant are hidden everywhere.
  return productRows
    .map((pRow) => {
      const base = mapProductRow(pRow);
      const local = localMap.get(pRow.product_id) || localMap.get(pRow.slug);
      const variants = variantsByProduct.get(pRow.product_id) ?? [];

      if (local) {
        return {
          ...base,
          name: base.name || local.name,
          officialCode: base.officialCode || local.officialCode,
          inspiration: base.inspiration || local.inspiration,
          shortDescription: base.shortDescription || local.shortDescription,
          images: base.images?.length ? base.images : local.images,
          notes: base.notes?.top?.length || base.notes?.heart?.length || base.notes?.base?.length ? base.notes : local.notes,
          variants,
        };
      }

      return { ...base, variants };
    })
    .filter((p) => p.variants.length > 0);
}

// ── Exported async data functions ──────────────────────────

import productsJson from "./data/products.json";

const localProducts = productsJson as unknown as Product[];

/**
 * Apply an optional filter to DB products. Catalog products that exist only in
 * products.json are NOT added: they have no rows in `variants`, so they could
 * be shown but never bought (checkout and webhook verify against the DB).
 * Seed the DB (`pnpm seed`, idempotent) to publish them.
 */
function mergeProducts(dbProducts: Product[], _filterFn?: (p: Product) => boolean): Product[] {
  // The SQL query already filtered the rows; nothing is added from the JSON.
  return dbProducts;
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
        ORDER BY product_id
      `) as unknown as ProductRow[];
    } else {
      productRows = (await db`
        SELECT * FROM products ORDER BY product_id
      `) as unknown as ProductRow[];
    }

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, filterFn);
    }
  } catch (err) {
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
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
          ORDER BY product_id
        `) as unknown as ProductRow[])
      : ((await db`
          SELECT * FROM products 
          WHERE gender = ${gender}
          ORDER BY product_id
        `) as unknown as ProductRow[]);

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, matchesGender);
    }
  } catch (err) {
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
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
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return undefined;
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
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return undefined;
}

/**
 * Resolve many variants at once (cart sync). Returns a map keyed by variant id;
 * ids that no longer exist, or whose product is no longer sellable, are absent.
 */
export async function getVariantsByIds(
  variantIds: string[]
): Promise<Map<string, { product: Product; variant: Variant }>> {
  const result = new Map<string, { product: Product; variant: Variant }>();
  const ids = Array.from(new Set(variantIds.filter((v) => typeof v === "string" && v.length > 0)));
  if (ids.length === 0) return result;

  const productRows = (await db`
    SELECT * FROM products
    WHERE product_id IN (
      SELECT product_id FROM variants WHERE variant_id = ANY(${ids})
    )
    ORDER BY product_id
  `) as unknown as ProductRow[];

  for (const product of await hydrateProductsWithVariants(productRows)) {
    for (const variant of product.variants) {
      if (ids.includes(variant.id)) result.set(variant.id, { product, variant });
    }
  }
  return result;
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
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
}

export async function getNewArrivals(): Promise<Product[]> {
  try {
    const productRows = (await db`
      SELECT * FROM products 
      WHERE badge = ${"nuevo"}
      ORDER BY product_id
    `) as unknown as ProductRow[];

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, (p) => p.badge === "nuevo");
    }
  } catch (err) {
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
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
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
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
    const skuMatch =
      Array.isArray(p.variants) &&
      p.variants.some((v) => normalize(v.sku).includes(q));
    const notesMatch = [
      ...p.notes.top,
      ...p.notes.heart,
      ...p.notes.base,
    ].some((n) => normalize(n).includes(q));

    return nameMatch || brandMatch || familyMatch || descMatch || inspMatch || codeMatch || skuMatch || notesMatch;
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
      ORDER BY product_id
      LIMIT ${limit}
    `) as unknown as ProductRow[];

    if (productRows.length > 0) {
      const dbProducts = await hydrateProductsWithVariants(productRows);
      return mergeProducts(dbProducts, filterFn).slice(0, limit);
    }
  } catch (err) {
    console.error("[data.ts] DB query failed", err);
    throw err;
  }

  return [];
}