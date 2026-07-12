import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { loadEnv, envSchema } from "./env";

const validEnv = {
  STRIPE_SECRET_KEY: "sk_test_1234567890",
  STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/sillage",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
};

// ---------------------------------------------------------------------------
// Schema validation tests (use the exported schema — no local copy)
// ---------------------------------------------------------------------------

describe("envSchema — validates environment variables", () => {
  it("passes validation with all valid environment variables", () => {
    const result = envSchema.parse(validEnv);

    expect(result.STRIPE_SECRET_KEY).toBe("sk_test_1234567890");
    expect(result.STRIPE_WEBHOOK_SECRET).toBe("whsec_1234567890");
    expect(result.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBe("pk_test_1234567890");
    expect(result.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/sillage");
    expect(result.UPSTASH_REDIS_REST_URL).toBe("https://example.upstash.io");
    expect(result.UPSTASH_REDIS_REST_TOKEN).toBe("token_1234567890");
  });

  it("fails validation when STRIPE_SECRET_KEY is empty", () => {
    const input = { ...validEnv, STRIPE_SECRET_KEY: "" };
    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when STRIPE_SECRET_KEY is missing", () => {
    const { STRIPE_SECRET_KEY: _removed, ...input } = validEnv;
    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when DATABASE_URL is not a valid URL", () => {
    const input = { ...validEnv, DATABASE_URL: "not-a-url" };
    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when UPSTASH_REDIS_REST_URL is not a valid URL", () => {
    const input = { ...validEnv, UPSTASH_REDIS_REST_URL: "not-a-url" };
    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("reports all missing fields in error message", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = Object.keys(result.error.flatten().fieldErrors);
      expect(fieldErrors).toContain("STRIPE_SECRET_KEY");
      expect(fieldErrors).toContain("STRIPE_WEBHOOK_SECRET");
      expect(fieldErrors).toContain("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      expect(fieldErrors).toContain("DATABASE_URL");
      expect(fieldErrors).toContain("UPSTASH_REDIS_REST_URL");
      expect(fieldErrors).toContain("UPSTASH_REDIS_REST_TOKEN");
    }
  });
});

// ---------------------------------------------------------------------------
// loadEnv — safeParse with graceful exit (Spec §4.1)
// ---------------------------------------------------------------------------

describe("loadEnv — safeParse with graceful exit", () => {
  let exitSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(() => {
    // Mock process.exit to throw (so the error path doesn't continue)
    // process.exit is typed as returning `never`, which makes the MockInstance
    // incompatible with MockInstance<any[], any> — cast to satisfy the type checker.
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code) => {
        throw new Error(`process.exit(${code ?? 0}) called`);
      }) as unknown as MockInstance;
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("returns parsed env object when all vars are valid", () => {
    const result = loadEnv(validEnv);

    expect(result.STRIPE_SECRET_KEY).toBe("sk_test_1234567890");
    expect(result.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/sillage");
    expect(result.UPSTASH_REDIS_REST_URL).toBe("https://example.upstash.io");
    expect(result.UPSTASH_REDIS_REST_TOKEN).toBe("token_1234567890");
  });

  it("does not call process.exit or console.error when all vars are valid", () => {
    loadEnv(validEnv);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("calls process.exit(1) when all env vars are missing", () => {
    expect(() => loadEnv({})).toThrow("process.exit(1) called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("lists all missing env var keys in error output", () => {
    expect(() => loadEnv({})).toThrow();

    const errorMessages = errorSpy.mock.calls.map((c) => String(c[0]));
    expect(errorMessages.some((m) => m.includes("STRIPE_SECRET_KEY"))).toBe(true);
    expect(errorMessages.some((m) => m.includes("STRIPE_WEBHOOK_SECRET"))).toBe(true);
    expect(errorMessages.some((m) => m.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"))).toBe(true);
    expect(errorMessages.some((m) => m.includes("DATABASE_URL"))).toBe(true);
    expect(errorMessages.some((m) => m.includes("UPSTASH_REDIS_REST_URL"))).toBe(true);
    expect(errorMessages.some((m) => m.includes("UPSTASH_REDIS_REST_TOKEN"))).toBe(true);
  });

  it("calls process.exit(1) when DATABASE_URL is invalid", () => {
    expect(() =>
      loadEnv({ ...validEnv, DATABASE_URL: "not-a-url" })
    ).toThrow("process.exit(1) called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("indicates DATABASE_URL failed URL validation in error message", () => {
    expect(() =>
      loadEnv({ ...validEnv, DATABASE_URL: "not-a-url" })
    ).toThrow();

    const errorMessages = errorSpy.mock.calls.map((c) => String(c[0]));
    expect(errorMessages.some((m) => m.includes("DATABASE_URL"))).toBe(true);
  });

  it("does not print a raw ZodError stack trace", () => {
    expect(() => loadEnv({})).toThrow("process.exit");

    const errorMessages = errorSpy.mock.calls.map((c) => String(c[0]));
    for (const msg of errorMessages) {
      // No stack trace frames in error output
      expect(msg).not.toMatch(/\n\s*at\s+/);
    }
  });

  it("does not throw a ZodError — graceful exit, not exception", () => {
    let threw = false;
    let threwValue: unknown;

    try {
      loadEnv({});
    } catch (e) {
      threw = true;
      threwValue = e;
    }

    expect(threw).toBe(true);
    // The thrown error should be from our process.exit mock, not a ZodError
    expect(threwValue).not.toHaveProperty("issues");
    expect(String(threwValue)).toContain("process.exit");
  });

  it("isolates each failure — prints every invalid key separately", () => {
    const input = {
      STRIPE_SECRET_KEY: "",
      DATABASE_URL: "bad",
      // remaining vars are missing entirely
    };

    expect(() => loadEnv(input)).toThrow();

    // Should have printed a message for every problematic key
    const errorMessages = errorSpy.mock.calls.map((c) => String(c[0]));
    // At least 6 issues: 1 empty + 1 invalid URL + 4 missing
    expect(errorMessages.length).toBeGreaterThanOrEqual(6);
  });
});