import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing route handlers
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock("@/lib/data/orders", () => ({
  saveOrder: vi.fn(),
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

vi.mock("@/lib/db", () => ({
  db: {},
  query: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { stripe } from "@/lib/stripe";
import { saveOrder } from "@/lib/data/orders";
import { query } from "@/lib/db";

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockSaveOrder = vi.mocked(saveOrder);
const mockQuery = vi.mocked(query);

/**
 * Helper: build a checkout.session.completed event with items and amount.
 */
function makeCheckoutEvent(
  amountTotal: number,
  items: Array<{ variantId: string; productId: string; sku: string; quantity: number }>,
  eventId = "evt_test"
) {
  return {
    type: "checkout.session.completed",
    id: eventId,
    data: {
      object: {
        id: "cs_test_123",
        amount_total: amountTotal,
        customer_email: "test@example.com",
        customer_details: { email: "test@example.com" },
        metadata: { items: JSON.stringify(items) },
      },
    },
  };
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockConstructEvent.mockReset();
    mockSaveOrder.mockReset();
  });

  // ─── Signature & basic flow ───

  it("rejects request without stripe-signature header", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects invalid webhook signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "invalid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  // ─── Spec §3.1 Scenario 1: Price match allows order save ───

  it("saves order when variant prices match amount_total", async () => {
    const items = [
      { variantId: "v1", productId: "p1", sku: "sku-1", quantity: 1 },
      { variantId: "v2", productId: "p2", sku: "sku-2", quantity: 1 },
    ];

    // DB returns prices: v1=90.00, v2=70.00 → expected 16000 cents
    const mockEvent = makeCheckoutEvent(16000, items);
    mockConstructEvent.mockReturnValue(mockEvent as any);
    mockQuery.mockResolvedValueOnce([
      { id: "v1", price: 90 },
      { id: "v2", price: 70 },
    ]);
    mockSaveOrder.mockResolvedValueOnce({ success: true, isDuplicate: false });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);

    // Verify the price-check SQL
    const priceCall = mockQuery.mock.calls[0]!;
    expect(priceCall[0]).toContain("SELECT");
    expect(priceCall[0]).toContain("variants");
    expect(priceCall[0]).toContain("ANY");
  });

  // ─── Spec §3.1 Scenario 2: Price mismatch blocks order save ───

  it("blocks order save when prices do not match amount_total", async () => {
    const items = [
      { variantId: "v1", productId: "p1", sku: "sku-1", quantity: 1 },
      { variantId: "v2", productId: "p2", sku: "sku-2", quantity: 1 },
    ];

    // DB returns prices: 90+70=160.00 → expected 16000 cents
    // But Stripe says amount_total=15000 → MISMATCH
    const mockEvent = makeCheckoutEvent(15000, items);
    mockConstructEvent.mockReturnValue(mockEvent as any);
    mockQuery.mockResolvedValueOnce([
      { id: "v1", price: 90 },
      { id: "v2", price: 70 },
    ]);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  // ─── Spec §3.1 Scenario 3: Missing variant blocks order save ───

  it("blocks order save when a variant is not found in the database", async () => {
    const items = [
      { variantId: "v1", productId: "p1", sku: "sku-1", quantity: 1 },
      { variantId: "gone", productId: "p2", sku: "sku-gone", quantity: 1 },
    ];

    // DB only finds v1, not "gone"
    const mockEvent = makeCheckoutEvent(16000, items);
    mockConstructEvent.mockReturnValue(mockEvent as any);
    mockQuery.mockResolvedValueOnce([{ id: "v1", price: 90 }]);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  // ─── Existing: empty items skips price check ───

  it("processes checkout.session.completed with empty items (skips price check)", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      id: "evt_test_123",
      data: {
        object: {
          id: "cs_test_123",
          amount_total: 7900,
          customer_email: "test@example.com",
          customer_details: { email: "test@example.com" },
          metadata: { items: "[]" },
        },
      },
    };

    mockConstructEvent.mockReturnValueOnce(mockEvent as any);
    mockSaveOrder.mockResolvedValueOnce({ success: true, isDuplicate: false });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled(); // Price check skipped for empty items
  });

  it("handles duplicate events idempotently", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      id: "evt_test_duplicate",
      data: {
        object: {
          id: "cs_test_dup",
          amount_total: 7900,
          customer_email: "test@example.com",
          customer_details: { email: "test@example.com" },
          metadata: { items: "[]" },
        },
      },
    };

    mockConstructEvent.mockReturnValueOnce(mockEvent as any);
    mockSaveOrder.mockResolvedValueOnce({ success: true, isDuplicate: true });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  // ─── Other events ───

  it("acknowledges charge.refunded events", async () => {
    const mockEvent = {
      type: "charge.refunded",
      id: "evt_refund",
      data: { object: { id: "ch_123", amount: 5000, currency: "eur" } },
    };

    mockConstructEvent.mockReturnValueOnce(mockEvent as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  it("acknowledges payment_intent.payment_failed events", async () => {
    const mockEvent = {
      type: "payment_intent.payment_failed",
      id: "evt_fail",
      data: { object: { id: "pi_123", last_payment_error: { message: "card declined" } } },
    };

    mockConstructEvent.mockReturnValueOnce(mockEvent as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSaveOrder).not.toHaveBeenCalled();
  });

  // ─── Price check with quantities ───

  it("calculates price correctly with multiple quantities", async () => {
    const items = [
      { variantId: "v1", productId: "p1", sku: "sku-1", quantity: 2 },
    ];

    // Price 79 × qty 2 = 158.00 → 15800 cents
    const mockEvent = makeCheckoutEvent(15800, items);
    mockConstructEvent.mockReturnValue(mockEvent as any);
    mockQuery.mockResolvedValueOnce([{ id: "v1", price: 79 }]);
    mockSaveOrder.mockResolvedValueOnce({ success: true, isDuplicate: false });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: { "stripe-signature": "valid_sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
  });
});