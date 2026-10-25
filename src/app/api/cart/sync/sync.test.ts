import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({ getVariantsByIds: vi.fn() }));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { getVariantsByIds } from "@/lib/data";

const mockGet = vi.mocked(getVariantsByIds);

const req = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/cart/sync", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/cart/sync", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("returns DB price with discount applied and flags missing variants", async () => {
    mockGet.mockResolvedValueOnce(
      new Map([
        [
          "v1",
          {
            product: { id: "p1", slug: "p-1", name: "P1", brand: "B", images: ["/a.jpg"], discount_percent: 20 } as any,
            variant: { id: "v1", size_ml: 50, price: 100, stock: 3, sku: "S" },
          },
        ],
      ])
    );

    const res = await POST(req({ variantIds: ["v1", "gone"] }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items[0]).toMatchObject({ variantId: "v1", available: true, price: 80, stock: 3 });
    expect(data.items[1]).toEqual({ variantId: "gone", available: false });
  });

  it("rejects invalid bodies and oversized carts", async () => {
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ variantIds: Array.from({ length: 51 }, (_, i) => `v${i}`) }))).status).toBe(413);
  });
});
