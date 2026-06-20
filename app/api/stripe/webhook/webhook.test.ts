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

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { stripe } from "@/lib/stripe";
import { saveOrder } from "@/lib/data/orders";

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockSaveOrder = vi.mocked(saveOrder);

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects request without stripe-signature header", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects invalid webhook signature", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
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

  it("processes valid checkout.session.completed event", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      id: "evt_test_123",
      data: {
        object: {
          id: "cs_test_123",
          amount_total: 7900,
          customer_email: "test@example.com",
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

    const data = await response.json();
    expect(data.received).toBe(true);
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
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
});