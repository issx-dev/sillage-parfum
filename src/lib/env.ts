import { z } from "zod";

export const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

export type EnvSchema = z.infer<typeof envSchema>;

/**
 * Validate an environment-variable source object using safeParse.
 *
 * On success: returns the typed, parsed env object.
 * On failure: prints every invalid/missing key via console.error, then
 * calls process.exit(1) — never throws a raw ZodError.
 */
export function loadEnv(
  source: Record<string, string | undefined> = process.env
): EnvSchema {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "(root)";
      console.error(`[env] ${key}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

// In test mode we skip module-level validation so the module can be imported
// without process.env being populated. Tests exercise loadEnv() directly.
export const env: EnvSchema = process.env.VITEST
  ? ({} as EnvSchema)
  : loadEnv();