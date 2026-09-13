// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});
vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

import { GET } from "./route";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const mockQuery = vi.mocked(query);
const mockVerify = vi.mocked(verifyToken);

function getReq(cookie?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new Request("http://localhost/api/orders/mine", { headers });
}

beforeEach(() => {
  mockQuery.mockReset();
  mockVerify.mockReset();
});

describe("GET /api/orders/mine", () => {
  it("returns 401 without a session cookie", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await GET(getReq("auth_token=bogus"));
    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns the user's orders mapped for the account page", async () => {
    mockVerify.mockResolvedValue({
      id: "u1",
      email: "Ana@Email.com",
      name: "Ana",
      role: "customer",
    });
    mockQuery.mockResolvedValue([
      {
        id: "o1",
        amount_total: 5670,
        currency: "eur",
        payment_status: "paid",
        fulfillment_status: "enviado",
        order_data: {
          items: [{ name: "Revenant", quantity: 1, price: 63, size_ml: 70 }],
          couponCode: "BIENVENIDA10",
          paymentMethod: "cod",
        },
        created_at: "2026-09-01T10:00:00.000Z",
      },
    ]);
    const res = await GET(getReq("auth_token=valid"));
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("FROM orders"), [
      "ana@email.com",
    ]);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0]).toMatchObject({
      id: "o1",
      total: 56.7,
      paymentStatus: "paid",
      fulfillmentStatus: "enviado",
      couponCode: "BIENVENIDA10",
    });
  });

  it("returns an empty list for users without orders", async () => {
    mockVerify.mockResolvedValue({
      id: "u2",
      email: "nueva@email.com",
      name: "Nueva",
      role: "customer",
    });
    mockQuery.mockResolvedValue([]);
    const res = await GET(getReq("auth_token=valid"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });
});
