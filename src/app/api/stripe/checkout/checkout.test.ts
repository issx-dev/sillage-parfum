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

  it("charges the discounted unit price", async () => {
    mockGetVariant.mockResolvedValueOnce({
      product: { ...mockProduct, discount_percent: 20 },
      variant: { ...mockVariant, price: 100 },
    });
    mockCreate.mockResolvedValueOnce({ id: "cs_test", url: "https://checkout.stripe.com/x" } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: "sauvage-dior", variantId: "sauvage-050", quantity: 2 }],
      }),
      headers: { origin: "http://localhost:3000" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const params = mockCreate.mock.calls[0]![0] as any;
    expect(params.line_items[0].price_data.unit_amount).toBe(8000);
    expect(params.line_items[0].quantity).toBe(2);
  });

  it("adds the flat shipping fee below the free-shipping threshold", async () => {
    mockGetVariant.mockResolvedValueOnce({ product: mockProduct, variant: mockVariant });
    mockCreate.mockResolvedValueOnce({ id: "cs", url: "https://checkout.stripe.com/x" } as any);
    const req = (qty: number) =>
      new NextRequest("http://localhost:3000/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: "sauvage-dior", variantId: "sauvage-050", quantity: qty }] }),
        headers: { origin: "http://localhost:3000" },
      });
    // Variant is 79 € → above the 50 € threshold → free shipping.
    await POST(req(1));
    let params = mockCreate.mock.calls[0]![0] as any;
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(0);

    mockGetVariant.mockResolvedValueOnce({ product: mockProduct, variant: { ...mockVariant, price: 30 } });
    mockCreate.mockResolvedValueOnce({ id: "cs", url: "https://checkout.stripe.com/x" } as any);
    await POST(req(1));
    params = mockCreate.mock.calls[1]![0] as any;
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(500);
  });

  it("rejects quantities above available stock with 409", async () => {
    mockGetVariant.mockResolvedValueOnce({ product: mockProduct, variant: { ...mockVariant, stock: 1 } });
    const response = await POST(
      new NextRequest("http://localhost:3000/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: "sauvage-dior", variantId: "sauvage-050", quantity: 3 }] }),
        headers: { origin: "http://localhost:3000" },
      })
    );
    expect(response.status).toBe(409);
    expect(mockCreate).not.toHaveBeenCalled();
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
});