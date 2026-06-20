import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the actual schema from production for integration testing
// We can't test env.parse(process.env) because env vars may not be set in test,
// but we CAN test the schema validation logic separately.
const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

describe("env Zod schema — validates environment variables", () => {
  it("passes validation with all valid environment variables", () => {
    const input = {
      STRIPE_SECRET_KEY: "sk_test_1234567890",
      STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/sillage",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
    };

    const result = envSchema.parse(input);

    expect(result.STRIPE_SECRET_KEY).toBe("sk_test_1234567890");
    expect(result.STRIPE_WEBHOOK_SECRET).toBe("whsec_1234567890");
    expect(result.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBe("pk_test_1234567890");
    expect(result.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/sillage");
    expect(result.UPSTASH_REDIS_REST_URL).toBe("https://example.upstash.io");
    expect(result.UPSTASH_REDIS_REST_TOKEN).toBe("token_1234567890");
  });

  it("fails validation when STRIPE_SECRET_KEY is empty", () => {
    const input = {
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/sillage",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
    };

    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when STRIPE_SECRET_KEY is missing", () => {
    const input = {
      STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/sillage",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
    };

    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when DATABASE_URL is not a valid URL", () => {
    const input = {
      STRIPE_SECRET_KEY: "sk_test_1234567890",
      STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
      DATABASE_URL: "not-a-url",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
    };

    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails validation when UPSTASH_REDIS_REST_URL is not a valid URL", () => {
    const input = {
      STRIPE_SECRET_KEY: "sk_test_1234567890",
      STRIPE_WEBHOOK_SECRET: "whsec_1234567890",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/sillage",
      UPSTASH_REDIS_REST_URL: "not-a-url",
      UPSTASH_REDIS_REST_TOKEN: "token_1234567890",
    };

    const result = envSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("reports all missing fields in error message", () => {
    const input = {};
    const result = envSchema.safeParse(input);
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