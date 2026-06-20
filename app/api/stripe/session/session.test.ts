import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing route handlers
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
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
import { GET } from "./route";
import { stripe } from "@/lib/stripe";

const mockRetrieve = vi.mocked(stripe.checkout.sessions.retrieve);

describe("GET /api/stripe/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only safe metrics from Stripe session", async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: "cs_test_123",
      payment_status: "paid",
      customer_email: "test@example.com",
      amount_total: 7900,
      currency: "eur",
      customer_details: { email: "test@example.com", name: "Test User" },
      payment_method_details: { card: { last4: "4242" } },
      metadata: { items: "internal-data" },
    } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/session?session_id=cs_test_123");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Verify only safe fields are returned
    expect(data).toEqual({
      payment_status: "paid",
      customer_email: "test@example.com",
      amount_total: 7900,
      currency: "eur",
    });
    // Verify sensitive fields are not exposed
    expect(data).not.toHaveProperty("customer_details");
    expect(data).not.toHaveProperty("payment_method_details");
    expect(data).not.toHaveProperty("metadata");
  });

  it("returns 400 when session_id is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/session");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("handles null values gracefully", async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: "cs_test_null",
      payment_status: "unpaid",
      customer_email: null,
      amount_total: null,
      currency: null,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/stripe/session?session_id=cs_test_null");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.customer_email).toBeNull();
    expect(data.amount_total).toBe(0);
    expect(data.currency).toBe("eur");
  });
});