import { describe, it, expect, vi } from "vitest";

import {
  FULFILLMENT_STATUSES,
  FULFILLMENT_LABELS,
  isFulfillmentStatus,
  fulfillmentBadgeVariant,
  onFulfillmentChange,
} from "./fulfillment";

describe("fulfillment", () => {
  it("expone los cuatro estados de envío en orden", () => {
    expect(FULFILLMENT_STATUSES).toEqual(["pendiente", "en_preparacion", "enviado", "recibido"]);
  });

  it("etiqueta cada estado en español", () => {
    expect(FULFILLMENT_LABELS).toEqual({
      pendiente: "Pendiente",
      en_preparacion: "En preparación",
      enviado: "Enviado",
      recibido: "Recibido",
    });
  });

  it("valida estados y rechaza los de pago", () => {
    expect(isFulfillmentStatus("enviado")).toBe(true);
    expect(isFulfillmentStatus("paid")).toBe(false);
    expect(isFulfillmentStatus(undefined)).toBe(false);
  });

  it("asigna variante de badge por estado", () => {
    expect(fulfillmentBadgeVariant("pendiente")).toBe("warning");
    expect(fulfillmentBadgeVariant("en_preparacion")).toBe("secondary");
    expect(fulfillmentBadgeVariant("enviado")).toBe("success");
    expect(fulfillmentBadgeVariant("recibido")).toBe("outline");
  });

  it("hook de cambio resuelve sin enviar email todavía", async () => {
    await expect(
      onFulfillmentChange({ orderId: "ord_1", from: "pendiente", to: "enviado" })
    ).resolves.toMatchObject({ notified: false });
  });

  it("hook delega en notify cuando se conecta el canal futuro", async () => {
    const notify = vi.fn();
    await expect(
      onFulfillmentChange({ orderId: "ord_1", from: "pendiente", to: "enviado", notify })
    ).resolves.toMatchObject({ notified: true });
    expect(notify).toHaveBeenCalledWith({ orderId: "ord_1", to: "enviado" });
  });
});
