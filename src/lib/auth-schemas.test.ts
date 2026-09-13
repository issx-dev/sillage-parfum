import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";

describe("loginSchema", () => {
  it("rejects empty email and short password with inline messages", () => {
    const r = loginSchema.safeParse({ email: "", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const flat = r.error.flatten().fieldErrors;
      expect(flat.email?.length).toBeGreaterThan(0);
      expect(flat.password?.length).toBeGreaterThan(0);
    }
  });

  it("rejects malformed email at the moment", () => {
    const r = loginSchema.safeParse({ email: "no-es-email", password: "123456" });
    expect(r.success).toBe(false);
  });

  it("accepts valid credentials", () => {
    const r = loginSchema.safeParse({ email: "tu@email.com", password: "123456" });
    expect(r.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("rejects short name and short password", () => {
    const r = registerSchema.safeParse({ name: "A", email: "x@y.com", password: "123" });
    expect(r.success).toBe(false);
  });

  it("accepts a valid registration payload", () => {
    const r = registerSchema.safeParse({
      name: "Ana Ruiz",
      email: "ana@email.com",
      password: "secreta1",
    });
    expect(r.success).toBe(true);
  });
});
