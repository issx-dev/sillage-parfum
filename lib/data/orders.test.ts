import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { existsSync, readdirSync, readFileSync } from "fs";
import { rm } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { readOrders, saveOrder } from "./orders";
import type { Order } from "@/types";

const mockOrder: Order = {
  id: "ord_test_123",
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
  total: 79,
  status: "paid",
  customerEmail: "test@example.com",
  createdAt: "2026-06-07T12:00:00.000Z",
  stripe_event_id: "evt_1",
};

let tmpFile: string;
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "orders-test-"));
  tmpFile = path.join(tmpDir, "orders.json");
});

afterEach(async () => {
  if (existsSync(tmpDir)) {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

describe("saveOrder", () => {
  it("writes valid JSON containing exactly the order with stripe_event_id", async () => {
    const result = await saveOrder(mockOrder, tmpFile, "evt_1");
    expect(result).toEqual({ success: true, isDuplicate: false });

    const raw = readFileSync(tmpFile, "utf-8");
    const parsed = JSON.parse(raw) as Order[];

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({ ...mockOrder, stripe_event_id: "evt_1" });
  });

  it("is idempotent on eventId — second save with same eventId does not append", async () => {
    const first = await saveOrder(mockOrder, tmpFile, "evt_1");
    const second = await saveOrder(mockOrder, tmpFile, "evt_1");

    expect(first).toEqual({ success: true, isDuplicate: false });
    expect(second).toEqual({ success: true, isDuplicate: true });

    const parsed = JSON.parse(readFileSync(tmpFile, "utf-8")) as Order[];
    expect(parsed).toHaveLength(1);
  });
});

describe("readOrders", () => {
  it("recovers from corrupt JSON by quarantining the file and returning []", async () => {
    await fs.writeFile(tmpFile, "{not valid json", "utf-8");

    const result = await readOrders(tmpFile);

    expect(result).toEqual([]);

    const siblings = readdirSync(tmpDir);
    const quarantined = siblings.filter((name) => name.startsWith("orders.json.corrupt."));
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0]).toMatch(/^orders\.json\.corrupt\.\d+$/);
    expect(existsSync(tmpFile)).toBe(false);
  });
});
