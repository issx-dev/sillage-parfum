import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./validate/route";

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
});
