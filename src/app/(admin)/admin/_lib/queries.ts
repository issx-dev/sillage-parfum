import "server-only";
import { LOW_STOCK_THRESHOLD, type StockLevel, type ProductFilter } from "./stock-level";
import { query, transaction } from "@/lib/db";
import { applyDiscount } from "@/lib/utils";
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
  order_data: {
    items?: Order["items"];
    paymentMethod?: Order["paymentMethod"];
    couponCode?: string;
    paymentIntent?: string | null;
    shipping?: Order["shipping"];
  } | null;
  created_at: string;
}

/**
 * Orders saved before items were snapshotted only have ids and quantities.
 * Fill name / size / unit price from the catalogue so the detail never shows
 * blanks or NaN; deleted variants keep a neutral label.
 */
async function enrichOrderItems(items: Order["items"]): Promise<Order["items"]> {
  const missing = items.filter((i) => !i.name || !Number.isFinite(Number(i.price)));
  if (missing.length === 0) return items;
  const ids = Array.from(new Set(missing.map((i) => i.variantId).filter(Boolean)));
  const rows = ids.length
    ? ((await query(
        `SELECT v.variant_id, p.name, p.brand, v.size_ml, v.price, COALESCE(p.discount_percent, 0) AS discount_percent
         FROM variants v JOIN products p ON p.product_id = v.product_id WHERE v.variant_id = ANY($1)`,
        [ids]
      )) as unknown as { variant_id: string; name: string; brand: string; size_ml: number; price: string | number; discount_percent: number }[])
    : [];
  const byId = new Map(rows.map((r) => [r.variant_id, r]));
  return items.map((i) => {
    if (i.name && Number.isFinite(Number(i.price))) return i;
    const r = byId.get(i.variantId);
    if (!r) return { ...i, name: i.name || "Producto eliminado", price: Number.isFinite(Number(i.price)) ? Number(i.price) : 0 };
    return {
      ...i,
      name: i.name || r.name,
      brand: i.brand || r.brand,
      size_ml: Number(i.size_ml) || Number(r.size_ml),
      price: Number.isFinite(Number(i.price)) ? Number(i.price) : applyDiscount(Number(r.price), Number(r.discount_percent)),
    };
  });
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
    items: await enrichOrderItems(row.order_data?.items ?? []),
    total: Number(row.amount_total) / 100,
    currency: row.currency,
    ...(row.order_data?.paymentMethod ? { paymentMethod: row.order_data.paymentMethod } : {}),
    ...(row.order_data?.couponCode ? { couponCode: row.order_data.couponCode } : {}),
    ...(row.order_data?.shipping ? { shipping: row.order_data.shipping } : {}),
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

function stockConds(search: string | undefined, level: StockLevel): { where: string; values: unknown[] } {
  const q = search?.trim();
  const conds: string[] = [];
  const values: unknown[] = [];
  if (q) {
    values.push(`%${q}%`);
    conds.push(`(p.name ILIKE $1 OR v.sku ILIKE $1 OR p.inspiration ILIKE $1)`);
  }
  if (level === "out") conds.push("v.stock = 0");
  if (level === "low") conds.push(`v.stock BETWEEN 1 AND ${LOW_STOCK_THRESHOLD}`);
  return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", values };
}

/**
 * Stock real por variante (DB `variants` x `products`). Sin fallbacks locales.
 * Con un nivel (`out`/`low`) los más urgentes salen primero.
 */
export async function readVariantStock(
  search?: string,
  opts?: { limit?: number; offset?: number; level?: StockLevel }
): Promise<VariantStockRow[]> {
  const level = opts?.level ?? "all";
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const { where, values } = stockConds(search, level);
  const order = level === "all" ? "p.name ASC, v.size_ml ASC" : "v.stock ASC, p.name ASC, v.size_ml ASC";
  const rows = (await query(
    `SELECT ${STOCK_SELECT}
     ${where}
     ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  )) as unknown as VariantStockDbRow[];

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

/** Nº total de variantes (con el mismo filtro) para paginar. */
export async function countVariantStock(search?: string, level: StockLevel = "all"): Promise<number> {
  const { where, values } = stockConds(search, level);
  const rows = (await query(
    `SELECT COUNT(*)::int AS n FROM variants v JOIN products p ON p.product_id = v.product_id ${where}`,
    values
  )) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

/** Recuentos globales (no solo de la página) para los filtros rápidos de stock. */
export async function readStockCounts(): Promise<{ total: number; out: number; low: number }> {
  const rows = (await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE stock = 0)::int AS out_n,
            COUNT(*) FILTER (WHERE stock BETWEEN 1 AND ${LOW_STOCK_THRESHOLD})::int AS low_n
     FROM variants`
  )) as unknown as { total: number; out_n: number; low_n: number }[];
  const r = rows[0];
  return { total: r?.total ?? 0, out: r?.out_n ?? 0, low: r?.low_n ?? 0 };
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
  /** Variantes con precio > 0: sin ninguna, la tienda oculta el producto. */
  valid_variant_count: number;
  total_stock: number;
  min_price: number | null;
}

export interface AdminProductDetail extends Omit<AdminProductRow, "variant_count" | "valid_variant_count" | "total_stock" | "min_price"> {
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
  valid_variant_count: string | number;
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
    valid_variant_count: Number(row.valid_variant_count),
    total_stock: Number(row.total_stock),
    min_price: row.min_price === null ? null : Number(row.min_price),
  };
}

const PRODUCT_COLS_P = PRODUCT_COLUMNS.split(",").map((c) => `p.${c.trim()}`).join(", ");

function productConds(
  search: string | undefined,
  filter: ProductFilter
): { where: string; having: string; values: unknown[] } {
  const q = search?.trim();
  const conds: string[] = [];
  const values: unknown[] = [];
  if (q) {
    values.push(`%${q}%`);
    conds.push(
      `(p.name ILIKE $1 OR p.brand ILIKE $1 OR p.slug ILIKE $1 OR p.inspiration ILIKE $1 OR EXISTS (SELECT 1 FROM variants v2 WHERE v2.product_id = p.product_id AND v2.sku ILIKE $1))`
    );
  }
  if (filter === "sale") conds.push("p.discount_percent > 0");
  // `hidden` = the storefront does not show it: no variant with a positive price.
  const having =
    filter === "out"
      ? "HAVING COALESCE(SUM(v.stock), 0) = 0"
      : filter === "hidden"
        ? "HAVING COUNT(v.variant_id) FILTER (WHERE v.price > 0) = 0"
        : "";
  return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", having, values };
}

/** Lista paginada de productos con agregados de variantes. */
export async function readProductsPage(opts?: {
  search?: string;
  filter?: ProductFilter;
  limit?: number;
  offset?: number;
}): Promise<AdminProductRow[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const { where, having, values } = productConds(opts?.search, opts?.filter ?? "all");
  const rows = (await query(
    `SELECT ${PRODUCT_COLS_P},
      COUNT(v.variant_id)::int AS variant_count,
      COUNT(v.variant_id) FILTER (WHERE v.price > 0)::int AS valid_variant_count,
      COALESCE(SUM(v.stock), 0)::int AS total_stock,
      MIN(v.price) FILTER (WHERE v.price > 0) AS min_price
     FROM products p LEFT JOIN variants v ON v.product_id = p.product_id
     ${where}
     GROUP BY ${PRODUCT_COLS_P}
     ${having}
     ORDER BY p.created_at DESC, p.name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  )) as unknown as AdminProductDbRow[];
  return rows.map(mapAdminProductRow);
}

/** Nº total de productos (mismo filtro) para paginar. */
export async function countProducts(search?: string, filter: ProductFilter = "all"): Promise<number> {
  const { where, having, values } = productConds(search, filter);
  const rows = (await query(
    `SELECT COUNT(*)::int AS n FROM (
       SELECT p.product_id FROM products p LEFT JOIN variants v ON v.product_id = p.product_id
       ${where} GROUP BY p.product_id ${having}
     ) t`,
    values
  )) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

/** Recuentos globales para los filtros rápidos del catálogo. */
export async function readProductCounts(): Promise<{ total: number; out: number; hidden: number; sale: number }> {
  const rows = (await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE stock_total = 0)::int AS out_n,
            COUNT(*) FILTER (WHERE valid_n = 0)::int AS hidden_n,
            COUNT(*) FILTER (WHERE discount > 0)::int AS sale_n
     FROM (
       SELECT p.product_id, p.discount_percent AS discount,
              COALESCE(SUM(v.stock), 0) AS stock_total,
              COUNT(v.variant_id) FILTER (WHERE v.price > 0) AS valid_n
       FROM products p LEFT JOIN variants v ON v.product_id = p.product_id
       GROUP BY p.product_id, p.discount_percent
     ) t`
  )) as unknown as { total: number; out_n: number; hidden_n: number; sale_n: number }[];
  const r = rows[0];
  return { total: r?.total ?? 0, out: r?.out_n ?? 0, hidden: r?.hidden_n ?? 0, sale: r?.sale_n ?? 0 };
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
