import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./validate/route";

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe("GET /api/coupons/validate", () => {
  it("validates SILLAGE2 (case-insensitive)", async () => {
    const request = new NextRequest("http://localhost:3000/api/coupons/validate?code=sillage2");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ valid: true, code: "SILLAGE2", percentOff: 10 });
  });

  it("rejects unknown codes with 404", async () => {
    const request = new NextRequest("http://localhost:3000/api/coupons/validate?code=FAKE99");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.valid).toBe(false);
  });

  it("rejects a missing code with 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/coupons/validate");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("validates BIENVENIDA10 without email (verified at charge time)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/coupons/validate?code=bienvenida10"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ valid: true, code: "BIENVENIDA10", percentOff: 10 });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("validates BIENVENIDA10 for a first-time email", async () => {
    mockQuery.mockResolvedValue([]);
    const request = new NextRequest(
      "http://localhost:3000/api/coupons/validate?code=BIENVENIDA10&email=nueva%40email.com"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it("rejects BIENVENIDA10 with 422 for an email with prior orders", async () => {
    mockQuery.mockResolvedValue([{ "1": 1 }]);
    const request = new NextRequest(
      "http://localhost:3000/api/coupons/validate?code=BIENVENIDA10&email=vieja%40email.com"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/primer pedido/i);
  });
});
