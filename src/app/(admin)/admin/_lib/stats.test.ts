import { describe, it, expect } from "vitest";
import { computeResumen } from "./stats";
import type { Order } from "@/types";

function order(partial: Partial<Order> & { id: string }): Order {
  return {
    items: [],
    total: 0,
    status: "paid",
    createdAt: "2026-09-08T10:00:00.000Z",
    stripe_event_id: `evt_${partial.id}`,
    ...partial,
  };
}

const NOW = new Date("2026-09-10T12:00:00.000Z");

describe("computeResumen", () => {
  it("calcula ingresos, ticket medio y reembolsos desde readOrders", () => {
    const orders = [
      order({ id: "1", total: 59, status: "paid", customerEmail: "a@example.com" }),
      order({ id: "2", total: 39, status: "paid", customerEmail: "b@example.com" }),
      order({ id: "3", total: 84, status: "refunded", customerEmail: "c@example.com" }),
    ];
    const stats = computeResumen(orders, 14, NOW);
    expect(stats.ingresos).toBe(98);
    expect(stats.numPedidos).toBe(3);
    expect(stats.numPagados).toBe(2);
    expect(stats.ticketMedio).toBe(49);
    expect(stats.reembolsos).toEqual({ count: 1, amount: 84 });
    expect(stats.fallidos).toBe(0);
    expect(stats.serie).toHaveLength(14);
  });

  it("acumula la serie diaria de ingresos pagados y deja a cero los días sin ventas", () => {
    const orders = [
      order({ id: "1", total: 50, status: "paid", createdAt: "2026-09-09T18:00:00.000Z" }),
      order({ id: "2", total: 84, status: "refunded", createdAt: "2026-09-09T19:00:00.000Z" }),
    ];
    const stats = computeResumen(orders, 3, NOW);
    expect(stats.serie.map((p) => p.day)).toEqual(["2026-09-08", "2026-09-09", "2026-09-10"]);
    expect(stats.serie.map((p) => p.total)).toEqual([0, 50, 0]);
  });

  it("devuelve ceros con catálogo vacío sin dividir por cero", () => {
    const stats = computeResumen([], 7, NOW);
    expect(stats.ingresos).toBe(0);
    expect(stats.ticketMedio).toBe(0);
    expect(stats.serie).toHaveLength(7);
  });
});
