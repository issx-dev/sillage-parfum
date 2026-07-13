import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module before importing the module under test.
// transaction() is mocked to simply pass the query mock as the txQuery
// function, so all query-level assertions work transparently.
vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return {
    db: {},
    query,
    transaction: vi.fn(),
  };
});

import { readOrders, saveOrder } from "./orders";
import { query, transaction } from "@/lib/db";
import type { CartItem } from "@/types";

const mockQuery = vi.mocked(query);
const mockTransaction = vi.mocked(transaction);

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

/**
 * A 2-item cart used by multi-variant tests.
 */
const twoItems: CartItem[] = [
  {
    variantId: "v1",
    productId: "product-1",
    slug: "product-one",
    name: "Product One",
    brand: "Brand",
    image: "/img/1.jpg",
    size_ml: 50,
    price: 90,
    quantity: 1,
  },
  {
    variantId: "v2",
    productId: "product-2",
    slug: "product-two",
    name: "Product Two",
    brand: "Brand",
    image: "/img/2.jpg",
    size_ml: 100,
    price: 70,
    quantity: 1,
  },
];

describe("saveOrder", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockTransaction.mockReset();
    // Default: transaction() delegates to the query mock.
    mockTransaction.mockImplementation(async (fn: (q: typeof query) => Promise<unknown>) =>
      fn(mockQuery)
    );
  });

  // ─── Spec §3.2 Scenario 4: Successful order with stock decrement ───

  it("inserts a new order and returns success with isDuplicate=false", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "new-uuid" }]); // INSERT
    mockQuery.mockResolvedValueOnce([{ id: "sauvage-050" }]); // UPDATE stock

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
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // Verify the SQL contains INSERT and ON CONFLICT
    const insertCall = mockQuery.mock.calls[0]!;
    expect(insertCall[0]).toContain("INSERT INTO orders");
    expect(insertCall[0]).toContain("ON CONFLICT");
  });

  it("decrements stock for each variant in a multi-item order", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "ord-uuid" }]); // INSERT
    mockQuery.mockResolvedValueOnce([{ id: "v1" }]); // UPDATE v1
    mockQuery.mockResolvedValueOnce([{ id: "v2" }]); // UPDATE v2

    const result = await saveOrder(
      {
        id: "cs_multi",
        items: twoItems,
        total: 160,
        status: "paid",
        customerEmail: "buyer@example.com",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      "evt_multi"
    );

    expect(result).toEqual({ success: true, isDuplicate: false });
    expect(mockQuery).toHaveBeenCalledTimes(3); // INSERT + 2 UPDATEs

    // Verify UPDATE SQL and params
    const update1 = mockQuery.mock.calls[1]!;
    expect(update1[0]).toContain("UPDATE variants");
    expect(update1[0]).toContain("stock = stock - $1");
    expect(update1[0]).toContain("stock >= $1");
    expect(update1[0]).toContain("RETURNING id");
    expect(update1[1]).toEqual([1, "v1"]); // [quantity, variantId]

    const update2 = mockQuery.mock.calls[2]!;
    expect(update2[0]).toContain("UPDATE variants");
    expect(update2[1]).toEqual([1, "v2"]);
  });

  // ─── Spec §3.2 Scenario 4: Duplicate order is idempotent ───

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

  it("duplicate order does NOT decrement stock", async () => {
    mockQuery.mockResolvedValueOnce([]); // INSERT returns 0 rows

    await saveOrder(
      {
        id: "cs_dup",
        items: mockOrderRow.order_data.items,
        total: 79,
        status: "paid",
        customerEmail: "test@example.com",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      "evt_dup"
    );

    // Only the INSERT query should have been called — no UPDATE.
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const call = mockQuery.mock.calls[0]!;
    expect(call[0]).toContain("INSERT INTO orders");
    expect(call[0]).not.toContain("UPDATE");
  });

  // ─── Spec §3.2 Scenario 2: Insufficient stock rolls back ───

  it("throws and rolls back when stock is insufficient", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "ord-uuid" }]); // INSERT succeeds
    mockQuery.mockResolvedValueOnce([]); // UPDATE returns 0 rows → insufficient

    await expect(
      saveOrder(
        {
          id: "cs_low_stock",
          items: mockOrderRow.order_data.items,
          total: 79,
          status: "paid",
          customerEmail: "test@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
        "evt_low"
      )
    ).rejects.toThrow("insufficient stock");

    // Only INSERT + 1 UPDATE; no further queries after 0-row result.
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  // ─── Spec §3.2 Scenario 3: Concurrent checkout race condition ───

  it("simulates race condition — second UPDATE fails when stock exhausted", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "ord-uuid" }]); // INSERT
    mockQuery.mockResolvedValueOnce([{ id: "v1" }]); // UPDATE v1 succeeds
    mockQuery.mockResolvedValueOnce([]); // UPDATE v2 fails (stock already taken)

    await expect(
      saveOrder(
        {
          id: "cs_race",
          items: twoItems,
          total: 160,
          status: "paid",
          customerEmail: "racer@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
        "evt_race"
      )
    ).rejects.toThrow("insufficient stock");

    expect(mockQuery).toHaveBeenCalledTimes(3); // INSERT + 2 UPDATEs
  });

  // ─── Existing validation ───

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

    // transaction() should NOT have been called when validation fails.
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("wraps all DB calls inside a transaction", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "new-uuid" }]); // INSERT
    mockQuery.mockResolvedValueOnce([{ id: "sauvage-050" }]); // UPDATE

    await saveOrder(
      {
        id: "cs_tx",
        items: mockOrderRow.order_data.items,
        total: 79,
        status: "paid",
        customerEmail: "test@example.com",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      "evt_tx"
    );

    // transaction() must be called exactly once.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // The callback was invoked synchronously (mockImplementation).
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe("readOrders", () => {
  beforeEach(() => {
    mockQuery.mockReset();
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