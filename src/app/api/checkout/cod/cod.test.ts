import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route handler
vi.mock("@/lib/data", () => ({
  getVariant: vi.fn(),
}));

vi.mock("@/lib/data/orders", () => ({
  saveOrder: vi.fn(),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { getVariant } from "@/lib/data";
import { saveOrder } from "@/lib/data/orders";

const mockGetVariant = vi.mocked(getVariant);
const mockSaveOrder = vi.mocked(saveOrder);

const product70 = {
  id: "p70",
  name: "Revenant Intense",
  slug: "revenant-intense",
  brand: "Chogan",
  family: "Amaderada",
  gender: "masculino",
  shortDescription: "d",
  badge: null,
  images: ["/images/x.jpg"],
  variants: [],
  discount_percent: 0,
  notes: { top: [], heart: [], base: [] },
};

const variant70 = { id: "v70", size_ml: 70, price: 35, stock: 10, sku: "s70" };

function codBody(overrides: Record<string, unknown> = {}) {
  return {
    customer: {
      email: "buyer@example.com",
      firstName: "Ana",
      lastName: "García",
      address: "Calle Real 1",
      city: "Madrid",
      postalCode: "28001",
      phone: "600123456",
    },
    items: [
      {
        variantId: "v70",
        productId: "p70",
        name: "Revenant Intense",
        size_ml: 70,
        price: 35,
        quantity: 2,
      },
    ],
    total: 63, // 2×70ml/35€ con bundle multi-compra
    paymentMethod: "cod",
    ...overrides,
  };
}

function codRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/checkout/cod", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/cod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVariant.mockResolvedValue({ product: product70, variant: variant70 } as any);
    mockSaveOrder.mockResolvedValue({ success: true, isDuplicate: false });
  });

  it("persists the order via saveOrder and returns a real redirect", async () => {
    const response = await POST(codRequest(codBody()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toMatch(/^\/checkout\/exito\?orderId=COD-/);

    // Persiste con el total VERIFICADO en servidor (63€ bundle, no el del cliente a ciegas)
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
    const [order, eventId] = mockSaveOrder.mock.calls[0]!;
    expect(order.total).toBe(63);
    expect(order.status).toBe("pending");
    expect(order.paymentMethod).toBe("cod");
    expect(order.customerEmail).toBe("buyer@example.com");
    expect(eventId).toBe(data.orderId);
  });

  it("rejects a client-manipulated total with 400", async () => {
    const response = await POST(codRequest(codBody({ total: 1 })));
    expect(response.status).toBe(400);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  it("applies SILLAGE2 server-side (2x70ml 63€ → 56.70€)", async () => {
    const response = await POST(
      codRequest(codBody({ total: 56.7, couponCode: "sillage2" }))
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    const [order] = mockSaveOrder.mock.calls[0]!;
    expect(order.total).toBe(56.7);
    expect(order.couponCode).toBe("SILLAGE2");
    expect(data.total).toBe(56.7);
  });

  it("rejects unknown coupon codes with 400", async () => {
    const response = await POST(codRequest(codBody({ couponCode: "FAKE99" })));
    expect(response.status).toBe(400);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  it("returns 409 when stock is insufficient (saveOrder throws)", async () => {
    mockSaveOrder.mockRejectedValueOnce(new Error("saveOrder: insufficient stock for variant v70"));

    const response = await POST(codRequest(codBody()));
    expect(response.status).toBe(409);
  });
});
