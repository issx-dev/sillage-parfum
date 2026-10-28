"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "../_lib/admin-auth";
import {
  couponInputSchema,
  createCoupon,
  setCouponActive,
  updateCoupon,
} from "@/lib/coupon-store";

/**
 * Server Actions de cupones. Solo admin (middleware + defensa en
 * profundidad). Validación con el mismo schema del store: código
 * A-Z0-9-, 1–90% (nunca gratis), checkbox solo-primer-pedido y activo.
 */

function parseForm(formData: FormData, opts?: { codeEditable?: boolean }) {
  const raw = {
    code: formData.get("code"),
    percentOff: formData.get("percentOff"),
    // Checkbox ausente = false.
    firstOrderOnly: formData.get("firstOrderOnly") === "on",
    active: formData.get("active") === "on",
  };
  const result = couponInputSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Datos no válidos.");
  }
  if (!opts?.codeEditable && typeof formData.get("code") !== "string") {
    throw new Error("Código no válido.");
  }
  return result.data;
}

export async function createCouponAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const input = parseForm(formData, { codeEditable: true });
  await createCoupon(input);
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones?toast=cupon-creado");
}

export async function updateCouponAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const code = formData.get("code");
  if (typeof code !== "string" || code.length === 0) {
    throw new Error("Código no válido.");
  }
  const { code: _ignored, ...rest } = parseForm(formData);
  await updateCoupon(code, rest);
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones?toast=cupon-actualizado");
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const code = formData.get("code");
  const active = formData.get("active");
  if (typeof code !== "string" || code.length === 0) {
    throw new Error("Código no válido.");
  }
  // El toggle envía el estado destino en un hidden.
  await setCouponActive(code, active === "true");
  revalidatePath("/admin/cupones");
}
