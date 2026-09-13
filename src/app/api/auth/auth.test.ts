// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { SignJWT } from "jose";

// Mock the database at the `query` seam (same pattern as orders.test.ts).
vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return { db: {}, query, transaction: vi.fn() };
});

import { POST as registerPOST } from "./register/route";
import { POST as loginPOST } from "./login/route";
import { POST as logoutPOST } from "./logout/route";
import { GET as meGET } from "./me/route";
import { query } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { decodeJwt } from "jose";

const mockQuery = vi.mocked(query);

const TEST_SECRET = "test-jwt-secret-min-32-chars-0123456789";

function postReq(path: string, body: unknown, cookie?: string): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookie) headers.cookie = cookie;
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function getReq(path: string, cookie?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new Request(`http://localhost${path}`, { headers });
}

const newUserRow = {
  id: "11111111-2222-4333-8444-555555555555",
  email: "nueva@test.com",
  name: "Nueva",
  role: "customer",
};

let knownHash: string;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  knownHash = await hashPassword("correct-password-123");
});

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  mockQuery.mockReset();
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe("POST /api/auth/register", () => {
  it("returns 400 for invalid body", async () => {
    const res = await registerPOST(
      postReq("/api/auth/register", {
        name: "A",
        email: "not-an-email",
        password: "123",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 generic with NO cookie for a duplicate email (H3 anti-enumeración)", async () => {
    mockQuery.mockResolvedValue([{ id: "existing-id" }]);
    const res = await registerPOST(
      postReq("/api/auth/register", {
        name: "Duplicada",
        email: "dup@test.com",
        password: "secret123",
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // Must NOT leak existence and must NOT start a session
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toContain("auth_token=");
  });

  it("returns 400 for short (<8) or denylisted passwords (H13)", async () => {
    for (const password of ["1234567", "password", "Sillage123", "qwerty123"]) {
      const res = await registerPOST(
        postReq("/api/auth/register", {
          name: "Fuerte",
          email: "fuerte@test.com",
          password,
        })
      );
      expect(res.status).toBe(400);
    }
  });

  it("creates the user, normalizes email, sets cookie and returns 201", async () => {
    mockQuery.mockImplementation(async (sql) => {
      if (String(sql).includes("SELECT")) return [];
      return [newUserRow];
    });
    const res = await registerPOST(
      postReq("/api/auth/register", {
        name: "Nueva",
        email: "NUEVA@test.com",
        password: "secret123",
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user).toEqual({
      id: newUserRow.id,
      email: "nueva@test.com",
      name: "Nueva",
      role: "customer",
    });
    // Never leak the hash
    expect(JSON.stringify(body)).not.toContain("password_hash");
    // Email was normalized before the lookup
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [
      "nueva@test.com",
    ]);
    // Session cookie set, httpOnly
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auth_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Max-Age=86400"); // H7: cookie 24h
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe("POST /api/auth/login", () => {
  it("returns 400 for invalid body", async () => {
    const res = await loginPOST(
      postReq("/api/auth/login", { email: "bad-email" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 invalid_credentials for an unknown user", async () => {
    mockQuery.mockResolvedValue([]);
    const res = await loginPOST(
      postReq("/api/auth/login", {
        email: "nadie@test.com",
        password: "whatever123",
      })
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_credentials" });
  });

  it("returns the same 401 for a wrong password", async () => {
    mockQuery.mockResolvedValue([
      { ...newUserRow, password_hash: knownHash },
    ]);
    const res = await loginPOST(
      postReq("/api/auth/login", {
        email: "nueva@test.com",
        password: "wrong-password",
      })
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_credentials" });
  });

  it("returns 200 + cookie for valid credentials", async () => {
    mockQuery.mockResolvedValue([
      { ...newUserRow, password_hash: knownHash },
    ]);
    const res = await loginPOST(
      postReq("/api/auth/login", {
        email: "NUEVA@test.com",
        password: "correct-password-123",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual({
      id: newUserRow.id,
      email: "nueva@test.com",
      name: "Nueva",
      role: "customer",
    });
    expect(JSON.stringify(body)).not.toContain("password_hash");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auth_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Max-Age=86400"); // H7: cookie 24h
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout (new) — GET /api/auth/me covered below
// ---------------------------------------------------------------------------

describe("POST /api/auth/logout", () => {
  it("clears the cookie and returns {success:true}", async () => {
    const res = await logoutPOST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auth_token=");
    expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

describe("GET /api/auth/me", () => {
  it("returns 401 {user:null} without a cookie", async () => {
    const res = await meGET(getReq("/api/auth/me"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ user: null });
  });

  it("returns 401 {user:null} for an invalid token", async () => {
    const res = await meGET(
      getReq("/api/auth/me", "auth_token=garbage.token.here")
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ user: null });
  });

  it("returns 200 with id/email/name/role for a valid token", async () => {
    const token = await signToken({
      id: "u-admin-1",
      email: "admin@test.com",
      name: "Admin",
      role: "admin",
    });
    const res = await meGET(getReq("/api/auth/me", `auth_token=${token}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: "u-admin-1",
        email: "admin@test.com",
        name: "Admin",
        role: "admin",
      },
    });
  });

  it("defaults legacy tokens without role to customer", async () => {
    const raw = new TextEncoder().encode(TEST_SECRET);
    const key = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    const legacy = await new SignJWT({
      id: "u-old-1",
      email: "old@test.com",
      name: "Old",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(key);
    const res = await meGET(getReq("/api/auth/me", `auth_token=${legacy}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe("customer");
  });
});

// ---------------------------------------------------------------------------
// H7 — JWT 24h (decisión CTO)
// ---------------------------------------------------------------------------

describe("H7 signToken lifetime", () => {
  it("issues tokens expiring 24h after iat", async () => {
    const token = await signToken({
      id: "u-1",
      email: "a@test.com",
      name: "A",
      role: "customer",
    });
    const { iat, exp } = decodeJwt(token);
    expect(typeof iat).toBe("number");
    expect(typeof exp).toBe("number");
    expect((exp as number) - (iat as number)).toBe(24 * 60 * 60);
  });
});
