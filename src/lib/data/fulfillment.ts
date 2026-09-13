import "server-only";

/**
 * Estados de envío del pedido (`fulfillment_status`).
 *
 * Independientes de los estados de pago (`paid` | `pending` | `refunded` |
 * `failed`, columna `payment_status`, intactos): un pedido pagado sigue su
 * circuito logístico aquí sin tocar el dinero.
 */
export const FULFILLMENT_STATUSES = [
  "pendiente",
  "en_preparacion",
  "enviado",
  "recibido",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  recibido: "Recibido",
};

export function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return (
    typeof value === "string" &&
    (FULFILLMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function fulfillmentBadgeVariant(
  status: FulfillmentStatus
): "success" | "secondary" | "warning" | "outline" {
  switch (status) {
    case "enviado":
      return "success";
    case "en_preparacion":
      return "secondary";
    case "recibido":
      return "outline";
    default:
      return "warning";
  }
}

/** Valor por defecto para pedidos creados antes de la columna o nuevos. */
export const DEFAULT_FULFILLMENT: FulfillmentStatus = "pendiente";

export function mapFulfillmentStatus(value: unknown): FulfillmentStatus {
  return isFulfillmentStatus(value) ? value : DEFAULT_FULFILLMENT;
}

export interface FulfillmentChange {
  orderId: string;
  from: FulfillmentStatus;
  to: FulfillmentStatus;
  /**
   * Canal futuro de aviso al cliente (email/SMS). Hoy es un no-op
   * documentado: se llama siempre tras persistir el cambio y se deja la
   * puerta abierta sin acoplar el envío al action.
   */
  notify?: (change: { orderId: string; to: FulfillmentStatus }) => void | Promise<void>;
}

/**
 * Hook post-cambio de estado de envío.
 *
 * HOOK PARA EMAIL FUTURO: cuando se quiera avisar al cliente («tu pedido
 * ha sido enviado»), implementar el envío dentro de `notify` o suscribir
 * un listener aquí — p. ej. encolar en una tabla `outbox` o llamar al
 * proveedor de email — sin tocar `updateFulfillmentStatus` (el action ya
 * invoca este hook en cada cambio persistido).
 *
 * Hoy: no notifica (`notified: false`); el cambio de estado ya quedó
 * guardado cuando esto corre.
 */
export async function onFulfillmentChange(
  change: FulfillmentChange
): Promise<{ notified: boolean }> {
  if (change.notify) {
    await change.notify({ orderId: change.orderId, to: change.to });
    return { notified: true };
  }
  return { notified: false };
}
