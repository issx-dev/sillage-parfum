import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module before importing the module under test
vi.mock("@/lib/db", () => ({
  db: {},
  query: vi.fn(),
}));

import { readOrders, saveOrder } from "./orders";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

const mockOrderRow = {
  id: "ord_test_123",
  stripe_event_id: "evt_1",
  stripe_session_id: "cs_test_123",
  customer_email: "test@example.com",
  amount_total: 7900,
  currency: "eur",
  payment_status: "paid",
  order_data: {
    items: [
      {
        variantId: "sauvage-050",
        productId: "sauvage-dior",
        slug: "sauvage-dior-edt",
        name: "Sauvage EDT",
        brand: "Dior",
        image: "/images/sauvage.jpg",
        size_ml: 50,
        price: 79,
        quantity: 1,
      },
    ],
  },
  created_at: new Date("2026-06-07T12:00:00.000Z"),
};

describe("saveOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new order and returns success with isDuplicate=false", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "new-uuid" }]);

    const result = await saveOrder(
      {
        id: "cs_test_123",
        items: mockOrderRow.order_data.items,
        total: 79,
        status: "paid",
        customerEmail: "test@example.com",
        createdAt: "2026-06-07T12:00:00.000Z",
      },
      "evt_1"
    );

    expect(result).toEqual({ success: true, isDuplicate: false });
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Verify the SQL contains INSERT and ON CONFLICT
    const callArgs = mockQuery.mock.calls[0]!;
    expect(callArgs[0]).toContain("INSERT INTO orders");
    expect(callArgs[0]).toContain("ON CONFLICT");
  });

  it("is idempotent on eventId — second save returns isDuplicate=true", async () => {
    // ON CONFLICT DO NOTHING returns empty result set
    mockQuery.mockResolvedValueOnce([]);

    const result = await saveOrder(
      {
        id: "cs_test_123",
        items: mockOrderRow.order_data.items,
        total: 79,
        status: "paid",
        customerEmail: "test@example.com",
        createdAt: "2026-06-07T12:00:00.000Z",
      },
      "evt_1"
    );

    expect(result).toEqual({ success: true, isDuplicate: true });
  });

  it("rejects orders missing customer_email", async () => {
    await expect(
      saveOrder(
        {
          id: "cs_test_123",
          items: [],
          total: 79,
          status: "paid",
          customerEmail: "",
          createdAt: "2026-06-07T12:00:00.000Z",
        },
        "evt_1"
      )
    ).rejects.toThrow("customer_email is required");
  });
});

describe("readOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped orders from database", async () => {
    mockQuery.mockResolvedValueOnce([mockOrderRow]);

    const orders = await readOrders();

    expect(orders).toHaveLength(1);
    expect(orders[0]).toEqual({
      id: "ord_test_123",
      stripe_event_id: "evt_1",
      items: mockOrderRow.order_data.items,
      total: 79,
      status: "paid",
      customerEmail: "test@example.com",
      createdAt: "2026-06-07T12:00:00.000Z",
    });
  });

  it("returns empty array when no orders exist", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const orders = await readOrders();
    expect(orders).toEqual([]);
  });
});