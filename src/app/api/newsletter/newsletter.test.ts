// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { POST } from "./route";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

function postReq(body: unknown): Request {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe("POST /api/newsletter", () => {
  it("persists a new subscriber with 201 and normalizes the email", async () => {
    mockQuery.mockResolvedValue([{ id: "uuid-1" }]);
    const res = await POST(postReq({ email: "  ANA@Email.com " }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO newsletter_subscribers"), [
      "ana@email.com",
      "lead_modal",
    ]);
  });

  it("returns an elegant 409 for a duplicate email", async () => {
    mockQuery.mockResolvedValue([]);
    const res = await POST(postReq({ email: "dup@email.com" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.alreadySubscribed).toBe(true);
    expect(body.error).toMatch(/ya está suscrito/i);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(postReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing email", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 500 when the database fails", async () => {
    mockQuery.mockRejectedValue(new Error("db down"));
    const res = await POST(postReq({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});
