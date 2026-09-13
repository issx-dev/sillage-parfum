"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireAdminUser } from "../_lib/admin-auth";
import { isOrderStatus } from "../_lib/queries";

/**
 * Cambia el estado de pago de un pedido (`paid` | `pending` | `refunded` | `failed`).
 * Solo admin (el middleware protege /admin/*; aquí defensa en profundidad).
 */
export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdminUser();

  const orderId = formData.get("orderId");
  const status = formData.get("status");

  if (typeof orderId !== "string" || orderId.length === 0) {
    throw new Error("Pedido no válido.");
  }
  if (!isOrderStatus(status)) {
    throw new Error("Estado no válido: debe ser paid, pending, refunded o failed.");
  }

  const rows = (await query(
    `UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING id`,
    [status, orderId]
  )) as unknown[];

  if (rows.length === 0) {
    throw new Error("Pedido no encontrado.");
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}
