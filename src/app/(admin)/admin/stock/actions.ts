"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireAdminUser } from "../_lib/admin-auth";

const MAX_STOCK = 999_999;

/**
 * Actualiza el stock de una variante (`UPDATE variants SET stock`).
 * Solo admin (el middleware protege /admin/*; aquí defensa en profundidad).
 */
export async function updateVariantStock(formData: FormData): Promise<void> {
  await requireAdminUser();

  const variantId = formData.get("variantId");
  const rawStock = formData.get("stock");

  if (typeof variantId !== "string" || variantId.length === 0) {
    throw new Error("Variante no válida.");
  }
  const stock = typeof rawStock === "string" ? Number(rawStock) : NaN;
  if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
    throw new Error(`Stock no válido: debe ser un entero entre 0 y ${MAX_STOCK}.`);
  }

  const rows = (await query(
    `UPDATE variants SET stock = $1 WHERE variant_id = $2 RETURNING variant_id`,
    [stock, variantId]
  )) as unknown[];

  if (rows.length === 0) {
    throw new Error("Variante no encontrada.");
  }

  // La tienda muestra stock ("Agotado") y precio: revalidarla también.
  const slugRows = (await query(
    `SELECT p.slug FROM products p JOIN variants v ON v.product_id = p.product_id WHERE v.variant_id = $1`,
    [variantId]
  )) as unknown as { slug: string }[];
  revalidatePath("/admin/stock");
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  if (slugRows[0]?.slug) revalidatePath(`/productos/${slugRows[0].slug}`);
}
