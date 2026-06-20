import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

describe("GET /api/search", () => {
  it("returns results for valid query", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=sauvage");
    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("query", "sauvage");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
  });

  it("returns empty results for short queries", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=a");
    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it("returns empty results for empty query", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=");
    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });
});