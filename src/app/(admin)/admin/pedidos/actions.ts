"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireAdminUser } from "../_lib/admin-auth";
import { isOrderStatus } from "../_lib/queries";
import { isFulfillmentStatus, onFulfillmentChange, type FulfillmentStatus } from "@/lib/data/fulfillment";

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

/**
 * Cambia el estado de envío de un pedido (`pendiente` | `en_preparacion` |
 * `enviado` | `recibido`). No toca el estado de pago.
 * Solo admin (el middleware protege /admin/*; aquí defensa en profundidad).
 * Tras persistir, invoca el hook `onFulfillmentChange` (puerta al email futuro).
 */
export async function updateFulfillmentStatus(formData: FormData): Promise<void> {
  await requireAdminUser();

  const orderId = formData.get("orderId");
  const fulfillment = formData.get("fulfillment");

  if (typeof orderId !== "string" || orderId.length === 0) {
    throw new Error("Pedido no válido.");
  }
  if (!isFulfillmentStatus(fulfillment)) {
    throw new Error("Estado de envío no válido: pendiente, en_preparacion, enviado o recibido.");
  }

  const current = (await query(`SELECT fulfillment_status FROM orders WHERE id = $1`, [
    orderId,
  ])) as unknown as { fulfillment_status: string }[];
  if (current.length === 0) {
    throw new Error("Pedido no encontrado.");
  }
  const from = (current[0]?.fulfillment_status ?? "pendiente") as FulfillmentStatus;

  await query(`UPDATE orders SET fulfillment_status = $1 WHERE id = $2`, [fulfillment, orderId]);

  await onFulfillmentChange({ orderId, from, to: fulfillment });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}
