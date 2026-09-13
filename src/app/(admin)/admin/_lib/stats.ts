import type { Order } from "@/types";

export interface ResumenStats {
  /** Suma de totales con estado `paid`. */
  ingresos: number;
  /** Nº total de pedidos registrados (todos los estados). */
  numPedidos: number;
  /** Nº de pedidos con estado `paid`. */
  numPagados: number;
  /** Ticket medio = ingresos / pagados (0 si no hay pagados). */
  ticketMedio: number;
  reembolsos: { count: number; amount: number };
  fallidos: number;
  /** Serie diaria de ingresos (pagados) de los últimos `days` días, orden ascendente. */
  serie: { day: string; total: number }[];
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * KPIs del Resumen calculados de `readOrders`. Función pura para poder
 * unit-testearla sin DB.
 */
export function computeResumen(orders: Order[], days = 14, now: Date = new Date()): ResumenStats {
  const paid = orders.filter((o) => o.status === "paid");
  const refunded = orders.filter((o) => o.status === "refunded");
  const ingresos = paid.reduce((acc, o) => acc + o.total, 0);

  const buckets = new Map<string, number>();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    buckets.set(dayKey(d), 0);
  }
  for (const o of paid) {
    const created = new Date(o.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const key = dayKey(created);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }

  return {
    ingresos,
    numPedidos: orders.length,
    numPagados: paid.length,
    ticketMedio: paid.length > 0 ? ingresos / paid.length : 0,
    reembolsos: {
      count: refunded.length,
      amount: refunded.reduce((acc, o) => acc + o.total, 0),
    },
    fallidos: orders.filter((o) => o.status === "failed").length,
    serie: Array.from(buckets.entries()).map(([day, total]) => ({ day, total })),
  };
}
