import "server-only";
import { query, transaction } from "@/lib/db";
import type { Order } from "@/types";
import { mapFulfillmentStatus, type FulfillmentStatus } from "@/lib/data/fulfillment";

export type OrderStatus = Order["status"];

const VALID_STATUSES: readonly OrderStatus[] = ["paid", "pending", "refunded", "failed"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (VALID_STATUSES as readonly string[]).includes(value)
  );
}

function mapPaymentStatus(status: unknown): OrderStatus {
  return status === "paid"
    ? "paid"
    : status === "pending"
      ? "pending"
      : status === "refunded"
        ? "refunded"
        : "failed";
}

export interface OrderDetail extends Order {
  stripe_session_id: string | null;
  currency: string;
  fulfillment: FulfillmentStatus;
}

interface OrderDetailRow {
  id: string;
  stripe_event_id: string;
  stripe_session_id: string | null;
  customer_email: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string | null;
  order_data: { items?: Order["items"] } | null;
  created_at: string;
}

/**
 * Detalle de un pedido por su id (UUID de la tabla `orders`).
 * Devuelve `null` si no existe. Los items salen de `order_data.items`,
 * escritos por `saveOrder` en el webhook de Stripe.
 */
export async function readOrderDetail(id: string): Promise<OrderDetail | null> {
  const rows = (await query(
    `SELECT id, stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, fulfillment_status, order_data, created_at FROM orders WHERE id = $1`,
    [id]
  )) as unknown as OrderDetailRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    stripe_event_id: row.stripe_event_id,
    stripe_session_id: row.stripe_session_id,
    items: row.order_data?.items ?? [],
    total: Number(row.amount_total) / 100,
    currency: row.currency,
    status: mapPaymentStatus(row.payment_status),
    fulfillment: mapFulfillmentStatus(row.fulfillment_status),
    customerEmail: row.customer_email,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export interface VariantStockRow {
  variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  size_ml: number;
  price: number;
  stock: number;
  sku: string;
}

interface VariantStockDbRow {
  variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  size_ml: number;
  price: string | number;
  stock: number;
  sku: string;
}

const STOCK_SELECT = `v.variant_id, v.product_id, p.name AS product_name, p.slug AS product_slug, p.images[1] AS product_image, v.size_ml, v.price, v.stock, v.sku
         FROM variants v JOIN products p ON p.product_id = v.product_id`;

/** Stock real por variante (DB `variants` × `products`). Sin fallbacks locales. */
export async function readVariantStock(
  search?: string,
  opts?: { limit?: number; offset?: number }
): Promise<VariantStockRow[]> {
  const q = search?.trim();
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const rows = q
    ? ((await query(
        `SELECT ${STOCK_SELECT}
         WHERE p.name ILIKE $1 OR v.sku ILIKE $1 OR p.inspiration ILIKE $1
         ORDER BY p.name ASC, v.size_ml ASC LIMIT $2 OFFSET $3`,
        [`%${q}%`, limit, offset]
      )) as unknown as VariantStockDbRow[])
    : ((await query(
        `SELECT ${STOCK_SELECT}
         ORDER BY p.name ASC, v.size_ml ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      )) as unknown as VariantStockDbRow[]);

  return rows.map((row) => ({
    variant_id: row.variant_id,
    product_id: row.product_id,
    product_name: row.product_name,
    product_slug: row.product_slug,
    product_image: row.product_image,
    size_ml: Number(row.size_ml),
    price: Number(row.price),
    stock: Number(row.stock),
    sku: row.sku,
  }));
}

/** Nº total de variantes (con el mismo filtro de búsqueda) para paginar. */
export async function countVariantStock(search?: string): Promise<number> {
  const q = search?.trim();
  const rows = q
    ? ((await query(
        `SELECT COUNT(*)::int AS n FROM variants v JOIN products p ON p.product_id = v.product_id
         WHERE p.name ILIKE $1 OR v.sku ILIKE $1 OR p.inspiration ILIKE $1`,
        [`%${q}%`]
      )) as unknown as { n: number }[])
    : ((await query(
        `SELECT COUNT(*)::int AS n FROM variants v`
      )) as unknown as { n: number }[]);
  return rows[0]?.n ?? 0;
}

// ── Productos (CRUD del panel) ────────────────────────────────────

export interface AdminProductRow {
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
  inspiration: string | null;
  variant_count: number;
  total_stock: number;
  min_price: number | null;
}

export interface AdminProductDetail extends Omit<AdminProductRow, "variant_count" | "total_stock" | "min_price"> {
  variants: {
    variant_id: string;
    size_ml: number;
    price: number;
    stock: number;
    sku: string;
  }[];
}

const PRODUCT_COLUMNS = `product_id, slug, name, brand, family, gender, short_description, badge, images, discount_percent, notes_top, notes_heart, notes_base, inspiration`;

interface AdminProductDbRow {
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
  inspiration: string | null;
  variant_count: string | number;
  total_stock: string | number;
  min_price: string | number | null;
}

function mapAdminProductRow(row: AdminProductDbRow): AdminProductRow {
  return {
    product_id: row.product_id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    family: row.family,
    gender: row.gender,
    short_description: row.short_description,
    badge: row.badge,
    images: row.images ?? [],
    discount_percent: Number(row.discount_percent),
    notes_top: row.notes_top ?? [],
    notes_heart: row.notes_heart ?? [],
    notes_base: row.notes_base ?? [],
    inspiration: row.inspiration ?? null,
    variant_count: Number(row.variant_count),
    total_stock: Number(row.total_stock),
    min_price: row.min_price === null ? null : Number(row.min_price),
  };
}

/** Lista paginada de productos con agregados de variantes. */
export async function readProductsPage(opts?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminProductRow[]> {
  const q = opts?.search?.trim();
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const base = `FROM products p LEFT JOIN variants v ON v.product_id = p.product_id`;
  const rows = q
    ? ((await query(
        `SELECT ${PRODUCT_COLUMNS.split(",").map((c) => `p.${c.trim()}`).join(", ")},
          COUNT(v.variant_id)::int AS variant_count,
          COALESCE(SUM(v.stock), 0)::int AS total_stock,
          MIN(v.price) AS min_price
         ${base} WHERE p.name ILIKE $1 OR p.brand ILIKE $1 OR p.slug ILIKE $1 OR p.inspiration ILIKE $1
         GROUP BY ${PRODUCT_COLUMNS.split(",").map((c) => `p.${c.trim()}`).join(", ")}
         ORDER BY p.created_at DESC, p.name ASC LIMIT $2 OFFSET $3`,
        [`%${q}%`, limit, offset]
      )) as unknown as AdminProductDbRow[])
    : ((await query(
        `SELECT ${PRODUCT_COLUMNS.split(",").map((c) => `p.${c.trim()}`).join(", ")},
          COUNT(v.variant_id)::int AS variant_count,
          COALESCE(SUM(v.stock), 0)::int AS total_stock,
          MIN(v.price) AS min_price
         ${base}
         GROUP BY ${PRODUCT_COLUMNS.split(",").map((c) => `p.${c.trim()}`).join(", ")}
         ORDER BY p.created_at DESC, p.name ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      )) as unknown as AdminProductDbRow[]);
  return rows.map(mapAdminProductRow);
}

/** Nº total de productos (mismo filtro) para paginar. */
export async function countProducts(search?: string): Promise<number> {
  const q = search?.trim();
  const rows = q
    ? ((await query(
        `SELECT COUNT(*)::int AS n FROM products p WHERE p.name ILIKE $1 OR p.brand ILIKE $1 OR p.slug ILIKE $1 OR p.inspiration ILIKE $1`,
        [`%${q}%`]
      )) as unknown as { n: number }[])
    : ((await query(`SELECT COUNT(*)::int AS n FROM products`)) as unknown as {
        n: number;
      }[]);
  return rows[0]?.n ?? 0;
}

/** Un producto con sus variantes para la pantalla de edición. */
export async function readProductAdmin(productId: string): Promise<AdminProductDetail | null> {
  const prows = (await query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE product_id = $1`, [
    productId,
  ])) as unknown as Omit<AdminProductDbRow, "variant_count" | "total_stock" | "min_price">[];
  const p = prows[0];
  if (!p) return null;
  const vrows = (await query(
    `SELECT variant_id, size_ml, price, stock, sku FROM variants WHERE product_id = $1 ORDER BY size_ml ASC`,
    [productId]
  )) as unknown as { variant_id: string; size_ml: number; price: string | number; stock: number; sku: string }[];
  return {
    product_id: p.product_id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    family: p.family,
    gender: p.gender,
    short_description: p.short_description,
    badge: p.badge,
    images: p.images ?? [],
    discount_percent: Number(p.discount_percent),
    notes_top: p.notes_top ?? [],
    notes_heart: p.notes_heart ?? [],
    notes_base: p.notes_base ?? [],
    inspiration: p.inspiration ?? null,
    variants: vrows.map((v) => ({
      variant_id: v.variant_id,
      size_ml: Number(v.size_ml),
      price: Number(v.price),
      stock: Number(v.stock),
      sku: v.sku,
    })),
  };
}

export interface ProductInput {
  name: string;
  slug: string;
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
  inspiration: string | null;
}

export async function updateProduct(productId: string, data: ProductInput): Promise<void> {
  const rows = (await query(
    `UPDATE products SET name=$1, slug=$2, brand=$3, family=$4, gender=$5, short_description=$6, badge=$7, images=$8, discount_percent=$9, notes_top=$10, notes_heart=$11, notes_base=$12, inspiration=$13 WHERE product_id=$14 RETURNING product_id`,
    [
      data.name, data.slug, data.brand, data.family, data.gender,
      data.short_description, data.badge, data.images, data.discount_percent,
      data.notes_top, data.notes_heart, data.notes_base, data.inspiration, productId,
    ]
  )) as unknown[];
  if (rows.length === 0) throw new Error("Producto no encontrado.");
}

export interface VariantInput {
  size_ml: number;
  price: number;
  stock: number;
  sku: string;
}

export async function updateVariantFull(variantId: string, data: VariantInput): Promise<void> {
  const rows = (await query(
    `UPDATE variants SET size_ml=$1, price=$2, stock=$3, sku=$4 WHERE variant_id=$5 RETURNING variant_id`,
    [data.size_ml, data.price, data.stock, data.sku, variantId]
  )) as unknown[];
  if (rows.length === 0) throw new Error("Variante no encontrada.");
}

export async function slugExists(slug: string, exceptProductId?: string): Promise<boolean> {
  const rows = exceptProductId
    ? ((await query(`SELECT product_id FROM products WHERE slug=$1 AND product_id<>$2`, [
        slug, exceptProductId,
      ])) as unknown[])
    : ((await query(`SELECT product_id FROM products WHERE slug=$1`, [slug])) as unknown[]);
  return rows.length > 0;
}

/** Crea producto + primera variante en una transacción. Devuelve el product_id. */
export async function createProduct(data: ProductInput, firstVariant: VariantInput): Promise<string> {
  const productId = `prod_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const variantId = `${productId}-v${firstVariant.size_ml}`;
  return transaction(async (tx) => {
    await tx(
      `INSERT INTO products (product_id, slug, name, brand, family, gender, short_description, badge, images, discount_percent, notes_top, notes_heart, notes_base, inspiration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        productId, data.slug, data.name, data.brand, data.family, data.gender,
        data.short_description, data.badge, data.images, data.discount_percent,
        data.notes_top, data.notes_heart, data.notes_base, data.inspiration,
      ]
    );
    await tx(
      `INSERT INTO variants (variant_id, product_id, size_ml, price, stock, sku) VALUES ($1,$2,$3,$4,$5,$6)`,
      [variantId, productId, firstVariant.size_ml, firstVariant.price, firstVariant.stock, firstVariant.sku]
    );
    return productId;
  });
}

export async function createVariant(productId: string, data: VariantInput): Promise<string> {
  const variantId = `${productId}-v${data.size_ml}-${Date.now().toString(36)}`;
  const rows = (await query(
    `INSERT INTO variants (variant_id, product_id, size_ml, price, stock, sku) VALUES ($1,$2,$3,$4,$5,$6) RETURNING variant_id`,
    [variantId, productId, data.size_ml, data.price, data.stock, data.sku]
  )) as unknown[];
  if (rows.length === 0) throw new Error("No se pudo crear la variante.");
  return variantId;
}

export async function deleteVariant(variantId: string): Promise<void> {
  const left = (await query(
    `SELECT COUNT(*)::int AS n FROM variants WHERE variant_id<>$1 AND product_id=(SELECT product_id FROM variants WHERE variant_id=$1)`,
    [variantId]
  )) as unknown as { n: number }[];
  if ((left[0]?.n ?? 0) === 0) {
    throw new Error("Un producto necesita al menos una variante: edítala en vez de borrarla.");
  }
  await query(`DELETE FROM variants WHERE variant_id=$1`, [variantId]);
}

/** Borra el producto y, en cascada, sus variantes. */
export async function deleteProduct(productId: string): Promise<void> {
  await query(`DELETE FROM products WHERE product_id=$1`, [productId]);
}
