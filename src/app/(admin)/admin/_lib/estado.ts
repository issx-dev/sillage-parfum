import type { Order } from "@/types";

/** Etiquetas humanas de estado — nunca el código crudo en la UI. */
export const STATUS_LABELS: Record<Order["status"], string> = {
  paid: "Pagado",
  pending: "Pendiente (COD)",
  refunded: "Reembolsado",
  failed: "Fallido",
};

export type StatusFilter = Order["status"] | "all";

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "paid", label: "Pagados" },
  { value: "pending", label: "Pendientes (COD)" },
  { value: "refunded", label: "Reembolsados" },
  { value: "failed", label: "Fallidos" },
];

export function statusBadgeVariant(status: Order["status"]): "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "pending" || status === "refunded") return "warning";
  return "danger";
}
