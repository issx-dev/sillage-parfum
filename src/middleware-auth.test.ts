// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware, rateLimitMap } from "./middleware";
import { signToken } from "./lib/auth";

const TEST_SECRET = "test-jwt-secret-min-32-chars-0123456789";

let customerToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  customerToken = await signToken({
    id: "u-cust-1",
    email: "cust@test.com",
    name: "Cust",
    role: "customer",
  });
  adminToken = await signToken({
    id: "u-admin-1",
    email: "admin@test.com",
    name: "Admin",
    role: "admin",
  });
});

function req(path: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) headers.set("cookie", `auth_token=${token}`);
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

function location(res: Response): string {
  return res.headers.get("location") ?? "";
}

describe("middleware auth gate", () => {
  it("redirects anonymous /cuenta to /login with next param", async () => {
    const res = await middleware(req("/cuenta"));
    expect(res.status).toBe(307);
    const loc = location(res);
    expect(loc).toContain("/login");
    expect(loc).toContain("next=");
    expect(loc).toContain(encodeURIComponent("/cuenta"));
  });

  it("redirects anonymous /admin to /login with next param", async () => {
    const res = await middleware(req("/admin/pedidos"));
    expect(res.status).toBe(307);
    expect(location(res)).toContain("/login");
  });

  it("redirects invalid-token /cuenta to /login", async () => {
    const res = await middleware(req("/cuenta", "bad.token.value"));
    expect(res.status).toBe(307);
    expect(location(res)).toContain("/login");
  });

  it("redirects customer on /admin/* to /cuenta?forbidden=1", async () => {
    const res = await middleware(req("/admin/pedidos", customerToken));
    expect(res.status).toBe(307);
    const loc = location(res);
    expect(loc).toContain("/cuenta");
    expect(loc).toContain("forbidden=1");
  });

  it("lets admin through on /admin/*", async () => {
    const res = await middleware(req("/admin/pedidos", adminToken));
    expect(res.status).not.toBe(307);
    expect(location(res)).not.toContain("/login");
  });

  it("lets an authenticated customer through on /cuenta", async () => {
    const res = await middleware(req("/cuenta", customerToken));
    expect(res.status).not.toBe(307);
    expect(location(res)).not.toContain("/login");
  });

  it("leaves public paths untouched", async () => {
    const res = await middleware(req("/"));
    expect(res.status).toBe(200);
    expect(location(res)).toBe("");
  });
});

describe("middleware security headers + auth rate limit (H1/H10)", () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it("H10: auth-gate redirects carry Content-Security-Policy", async () => {
    const res = await middleware(req("/cuenta"));
    expect(res.status).toBe(307);
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'self'");
  });

  it("H1: /api/auth/* limited to 5/min per IP; H10: 429 carries CSP + Retry-After", async () => {
    let res: Response | undefined;
    for (let i = 0; i < 5; i++) {
      res = await middleware(req("/api/auth/login"));
      expect(res.status).toBe(200);
    }
    res = await middleware(req("/api/auth/login"));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'self'");
  });
});
