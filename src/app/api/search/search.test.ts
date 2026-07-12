import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/data", () => ({
  searchProducts: vi.fn(),
}));

import { GET } from "./route";
import { searchProducts } from "@/lib/data";

const mockSearchProducts = vi.mocked(searchProducts);

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns results for valid query", async () => {
    mockSearchProducts.mockResolvedValueOnce([
      {
        id: "sauvage-dior",
        slug: "sauvage-dior-edt",
        name: "Sauvage Dior EDT",
        brand: "Dior",
        family: "Amaderado",
        gender: "masculino",
        shortDescription: "Fresca sensación de libertad",
        badge: "oferta",
        images: ["/images/products/sauvage-dior-front.jpg"],
        variants: [],
        discount_percent: 0,
        notes: { top: ["Bergamota"], heart: ["Pimienta"], base: ["Ambroxan"] },
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/search?q=sauvage");
    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("query", "sauvage");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results).toHaveLength(1);
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