import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product, Variant } from "@/types";

// Mock dependencies before importing route handlers
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/data", () => ({
  getVariant: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_key",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_key",
    DATABASE_URL: "postgresql://test:test@localhost/sillage",
    UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test_token",
  },
}));

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { stripe } from "@/lib/stripe";
import { getVariant } from "@/lib/data";

const mockCreate = vi.mocked(stripe.checkout.sessions.create);
const mockGetVariant = vi.mocked(getVariant);

const mockProduct: Product = {
  id: "sauvage-dior",
  name: "Sauvage EDT",
  slug: "sauvage-dior-edt",
  brand: "Dior",
  family: "Amaderada",
  gender: "masculino",
  shortDescription: "Fragancia amaderada para hombre",
  badge: null,
  images: ["/images/sauvage.jpg"],
  variants: [],
  discount_percent: 0,
  notes: { top: ["Bergamota"], heart: ["Pimienta"], base: ["Ambroxan"] },
};

const mockVariant: Variant = {
  id: "sauvage-050",
  size_ml: 50,
  price: 79,
  stock: 10,
  sku: "sau-050",
};

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a valid Stripe session with promotion codes enabled", async () => {
    mockGetVariant.mockResolvedValueOnce({
      product: mockProduct,
      variant: mockVariant,
    });

    mockCreate.mockResolvedValueOnce({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            productId: "sauvage-dior-edt",
            variantId: "sauvage-050",
            name: "Sauvage EDT",
            brand: "Dior",
            image: "/images/sauvage.jpg",
            size_ml: 50,
            price: 79,
            quantity: 1,
          },
        ],
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe("https://checkout.stripe.com/pay/cs_test_123");

    // Verify allow_promotion_codes is set
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0]!;
    const sessionParams = callArgs[0] as Record<string, unknown>;
    expect(sessionParams.allow_promotion_codes).toBe(true);
  });

  it("rejects empty cart with 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ items: [] }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects invalid items with 404", async () => {
    mockGetVariant.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            productId: "nonexistent-product",
            variantId: "nonexistent-variant",
            name: "Fake",
            brand: "Fake",
            price: 99,
            quantity: 1,
          },
        ],
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("charges the product discount (discount_percent), not the raw variant price", async () => {
    mockGetVariant.mockResolvedValueOnce({
      product: { ...mockProduct, discount_percent: 10 },
      variant: mockVariant, // 79€ → 71.10€ con −10%
    });
    mockCreate.mockResolvedValueOnce({ id: "cs_disc", url: "https://x" } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            productId: "sauvage-dior",
            variantId: "sauvage-050",
            name: "Sauvage EDT",
            brand: "Dior",
            image: "/images/sauvage.jpg",
            size_ml: 50,
            price: 1, // precio manipulado: el servidor debe ignorarlo
            quantity: 1,
          },
        ],
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const unit = (mockCreate.mock.calls[0]![0] as any).line_items[0];
    expect(unit.price_data.unit_amount).toBe(7110);
  });

  it("applies the multibuy bundle: 2x70ml/35€ totals 6300, not 7000", async () => {
    const std70 = { id: "v70", size_ml: 70, price: 35, stock: 10, sku: "s70" };
    mockGetVariant.mockResolvedValue({
      product: { ...mockProduct, discount_percent: 0 },
      variant: std70,
    });
    mockCreate.mockResolvedValueOnce({ id: "cs_mb", url: "https://x" } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [
          { productId: "p", variantId: "v70", size_ml: 70, price: 35, quantity: 2 },
        ],
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const args = mockCreate.mock.calls[0]![0] as any;
    const total = args.line_items.reduce(
      (s: number, li: any) => s + li.price_data.unit_amount * li.quantity,
      0
    );
    expect(total).toBe(6300);
  });

  it("applies SILLAGE2 coupon and records it in metadata", async () => {
    mockGetVariant.mockResolvedValueOnce({
      product: mockProduct, // discount_percent 0: 79€ → −10% = 71.10€
      variant: mockVariant,
    });
    mockCreate.mockResolvedValueOnce({ id: "cs_cp", url: "https://x" } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [
          { productId: "sauvage-dior", variantId: "sauvage-050", size_ml: 50, price: 79, quantity: 1 },
        ],
        couponCode: "sillage2",
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const args = mockCreate.mock.calls[0]![0] as any;
    const total = args.line_items.reduce(
      (s: number, li: any) => s + li.price_data.unit_amount * li.quantity,
      0
    );
    expect(total).toBe(7110); // 7900 × 0.9
    expect(JSON.parse(args.metadata.items)[0].quantity).toBe(1);
    expect(args.metadata.couponCode).toBe("SILLAGE2");
  });

  it("rejects unknown coupon codes with 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: "p", variantId: "v", quantity: 1 }],
        couponCode: "FAKE99",
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});