import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

// Pin the API version to the latest the installed SDK supports.
// `stripe@16.2.0` exposes `LatestApiVersion = "2024-06-20"` — pinning a
// newer version would cause a type error. When upgrading the SDK,
// bump this to the new `LatestApiVersion` and re-validate the
// checkout/webhook payloads against the Stripe changelog.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});
