"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdminUser } from "../_lib/admin-auth";
import { slugify, resolveUniqueSlug } from "@/lib/slug";
import {
  PRODUCT_IMAGES_BUCKET,
  buildProductImageKey,
  isAllowedProductImageSize,
  isAllowedProductImageType,
} from "./_lib/image-upload";
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  readProductAdmin,
  slugExists,
  updateProduct,
  updateVariantFull,
  type AdminProductDetail,
  type ProductInput,
  type VariantInput,
} from "../_lib/queries";

const GENDERS = ["masculino", "femenino", "unisex"] as const;
const BADGES = ["nuevo", "oferta", "top_ventas"] as const;

const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre necesita al menos 2 caracteres."),
  brand: z.string().trim().min(1, "La marca es obligatoria."),
  family: z.string().trim().min(1, "La familia olfativa es obligatoria."),
  inspiration: z.string().trim().max(120, "Máximo 120 caracteres.").optional().default(""),
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

async function productInputFrom(formData: FormData, exceptProductId?: string): Promise<ProductInput> {
  const parsed = productSchema.parse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    family: formData.get("family"),
    inspiration: formData.get("inspiration") ?? "",
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
  // Slug automático SOLO al crear. En edición el slug existente es sagrado:
  // regenerarlo rompía URLs y hacía desaparecer productos del buscador
  // (el código Chogan vive en el slug/SKU, no en el nombre).
  let slug: string;
  if (exceptProductId) {
    const current = (await query(`SELECT slug FROM products WHERE product_id=$1`, [
      exceptProductId,
    ])) as unknown as { slug: string }[];
    if (!current[0]?.slug) throw new Error("Producto no encontrado.");
    slug = current[0].slug;
  } else {
    const base = slugify(parsed.name);
    if (!base) throw new Error("No se pudo generar un slug desde el nombre.");
    slug = await resolveUniqueSlug(base, (s) => slugExists(s));
  }
  return {
    name: parsed.name,
    slug,
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
    inspiration: parsed.inspiration === "" ? null : parsed.inspiration,
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
  const data = await productInputFrom(formData);
  const variant = variantInputFrom(formData);
  const productId = await createProduct(data, variant);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
  // El catálogo y la home cacheados deben incluir el producto nuevo.
  revalidateStorefront(data.slug);
  redirect(`/admin/productos/${productId}`);
}

/** Ficha para edición rápida en modal (solo admin). Devuelve null si no existe. */
export async function getProductForEdit(productId: string): Promise<AdminProductDetail | null> {
  await requireAdminUser();
  return readProductAdmin(productId);
}

/** Guarda los cambios de la ficha del producto. */
export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) throw new Error("Producto no válido.");
  const data = await productInputFrom(formData, productId);
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

export type UploadProductImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Sube una imagen al bucket `product-images` de Supabase Storage y devuelve
 * su URL pública. Solo admin. Límites (bucket público, 5 MB, solo imágenes)
 * validados aquí antes de llamar a la API.
 *
 * Requiere `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` en el entorno del
 * servidor (nunca expuestas al cliente): la policy del bucket solo permite
 * gestionar objetos al `service_role`.
 */
export async function uploadProductImage(formData: FormData): Promise<UploadProductImageResult> {
  await requireAdminUser();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return {
      ok: false,
      error: "Subida no configurada: faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Elige un archivo de imagen." };
  }
  if (!isAllowedProductImageType(file.type)) {
    return { ok: false, error: `«${file.name}» no es una imagen.` };
  }
  if (!isAllowedProductImageSize(file.size)) {
    return { ok: false, error: `«${file.name}» supera los 5 MB.` };
  }

  const key = buildProductImageKey("admin-upload", file.name);
  const putUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${key}`;
  let putRes: Response;
  try {
    putRes = await fetch(putUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: Buffer.from(await file.arrayBuffer()),
    });
  } catch {
    return { ok: false, error: "No se pudo contactar con el almacenamiento." };
  }
  if (!putRes.ok) {
    return { ok: false, error: `La subida falló (${putRes.status}).` };
  }
  const publicUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${key}`;
  return { ok: true, url: publicUrl };
}
