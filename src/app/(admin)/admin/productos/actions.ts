"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdminUser } from "../_lib/admin-auth";
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  slugExists,
  updateProduct,
  updateVariantFull,
  type ProductInput,
  type VariantInput,
} from "../_lib/queries";

const GENDERS = ["masculino", "femenino", "unisex"] as const;
const BADGES = ["nuevo", "oferta", "top_ventas"] as const;

const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre necesita al menos 2 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no válido: solo minúsculas, números y guiones."),
  brand: z.string().trim().min(1, "La marca es obligatoria."),
  family: z.string().trim().min(1, "La familia olfativa es obligatoria."),
  gender: z.enum(GENDERS, { message: "Género no válido." }),
  short_description: z.string().trim().min(10, "La descripción necesita al menos 10 caracteres."),
  badge: z.string().trim().optional().default(""),
  discount_percent: z.coerce.number().int().min(0).max(90),
  images: z.string().optional().default(""),
  notes_top: z.string().optional().default(""),
  notes_heart: z.string().optional().default(""),
  notes_base: z.string().optional().default(""),
});

const variantSchema = z.object({
  size_ml: z.coerce.number().int().min(1).max(1000),
  price: z.coerce.number().min(0).max(100000),
  stock: z.coerce.number().int().min(0).max(999999),
  sku: z.string().trim().min(1, "El SKU es obligatorio.").max(64),
});

function csv(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function imageLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://"));
}

function productInputFrom(formData: FormData): ProductInput {
  const parsed = productSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand: formData.get("brand"),
    family: formData.get("family"),
    gender: formData.get("gender"),
    short_description: formData.get("short_description"),
    badge: formData.get("badge") ?? "",
    discount_percent: formData.get("discount_percent"),
    images: formData.get("images") ?? "",
    notes_top: formData.get("notes_top") ?? "",
    notes_heart: formData.get("notes_heart") ?? "",
    notes_base: formData.get("notes_base") ?? "",
  });
  const badge = parsed.badge === "" ? null : (parsed.badge as (typeof BADGES)[number]);
  if (parsed.badge !== "" && !(BADGES as readonly string[]).includes(parsed.badge)) {
    throw new Error("Insignia no válida.");
  }
  return {
    name: parsed.name,
    slug: parsed.slug,
    brand: parsed.brand,
    family: parsed.family,
    gender: parsed.gender,
    short_description: parsed.short_description,
    badge,
    images: imageLines(parsed.images),
    discount_percent: parsed.discount_percent,
    notes_top: csv(parsed.notes_top),
    notes_heart: csv(parsed.notes_heart),
    notes_base: csv(parsed.notes_base),
  };
}

function variantInputFrom(formData: FormData): VariantInput {
  return variantSchema.parse({
    size_ml: formData.get("size_ml"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
  });
}

/** Crea producto + primera variante y redirige a su edición. */
export async function createProductAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const data = productInputFrom(formData);
  const variant = variantInputFrom(formData);
  if (await slugExists(data.slug)) {
    throw new Error(`El slug «${data.slug}» ya existe: elige otro.`);
  }
  const productId = await createProduct(data, variant);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  // El catálogo y la home cacheados deben incluir el producto nuevo.
  revalidateStorefront(data.slug);
  redirect(`/admin/productos/${productId}`);
}

/** Guarda los cambios de la ficha del producto. */
export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) throw new Error("Producto no válido.");
  const data = productInputFrom(formData);
  if (await slugExists(data.slug, productId)) {
    throw new Error(`El slug «${data.slug}» ya lo usa otro producto.`);
  }
  await updateProduct(productId, data);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  revalidatePath(`/productos/${data.slug}`);
  revalidatePath("/productos");
  revalidatePath("/");
}

/** Borra el producto (requiere confirmación explícita) y vuelve al listado. */
export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const productId = formData.get("productId");
  const confirm = formData.get("confirm");
  if (typeof productId !== "string" || !productId) throw new Error("Producto no válido.");
  if (confirm !== "ELIMINAR") throw new Error("Escribe ELIMINAR para confirmar el borrado.");
  // Slug ANTES de borrar: la ficha /productos/[slug] debe revalidarse o la
  // caché seguiría sirviéndola con 200 tras el borrado.
  const slugRows = (await query(`SELECT slug FROM products WHERE product_id=$1`, [productId])) as unknown as {
    slug: string;
  }[];
  const slug = slugRows[0]?.slug ?? null;
  await deleteProduct(productId);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  revalidateStorefront(slug);
  redirect("/admin/productos");
}

/** Slug del producto de una variante, para revalidar su ficha en la tienda. */
async function slugForVariant(variantId: string): Promise<string | null> {
  const rows = (await query(
    `SELECT p.slug FROM products p JOIN variants v ON v.product_id = p.product_id WHERE v.variant_id = $1`,
    [variantId]
  )) as unknown as { slug: string }[];
  return rows[0]?.slug ?? null;
}

function revalidateStorefront(slug?: string | null): void {
  revalidatePath("/productos");
  revalidatePath("/");
  if (slug) revalidatePath(`/productos/${slug}`);
}

/** Añade una variante al producto. */
export async function createVariantAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) throw new Error("Producto no válido.");
  await createVariant(productId, variantInputFrom(formData));
  const slug = (await query(`SELECT slug FROM products WHERE product_id=$1`, [productId])) as unknown as {
    slug: string;
  }[];
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  revalidateStorefront(slug[0]?.slug);
}

/** Guarda tamaño/precio/stock/SKU de una variante. */
export async function updateVariantAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const variantId = formData.get("variantId");
  if (typeof variantId !== "string" || !variantId) throw new Error("Variante no válida.");
  await updateVariantFull(variantId, variantInputFrom(formData));
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  revalidateStorefront(await slugForVariant(variantId));
}

/** Borra una variante (nunca la última del producto). */
export async function deleteVariantAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const variantId = formData.get("variantId");
  if (typeof variantId !== "string" || !variantId) throw new Error("Variante no válida.");
  await deleteVariant(variantId);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  revalidateStorefront(await slugForVariant(variantId));
}
