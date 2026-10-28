# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SILLAGE — luxury perfume e-commerce (Spanish-language UI/routes: `/productos`, `/carrito`, `/favoritos`). Next.js 14 App Router, TypeScript, Tailwind 3, Zustand, Stripe Checkout, Postgres (`postgres` driver), Upstash Redis rate limiting. Path alias `@/*` → `src/*`.

Note: `README.md` is partly stale (mentions npm, a JSON-only catalog, and a `parfum/` layout). The real source of truth is `src/` plus the points below. CI uses **pnpm** (v10, Node 20).

## Commands

```bash
pnpm dev                      # next dev
pnpm build                    # also serves as the type-check in CI
pnpm lint                     # next lint
pnpm test                     # vitest run (jsdom)
pnpm test:watch               # vitest watch
pnpm vitest run src/lib/data/orders.test.ts          # single file
pnpm vitest run -t "name of test"                    # single test by name
pnpm seed                     # tsx: loads src/lib/data/products.json into Postgres
```

Local setup: `cp .env.local.example .env.local`, create the DB with `docs/database/schema.sql`, run `pnpm seed`, and for webhooks run `stripe listen --forward-to localhost:3000/api/stripe/webhook`. CI order is: apply schema → seed → lint → build → test (with placeholder env vars and a Postgres 16 service).

Vitest only picks up tests under `src/{app,components,lib,store,hooks,scripts}` and `src/*.test.*` (see `vitest.config.ts`); tests are colocated with the code. `server-only` is aliased to `test/shims/server-only.ts`.

## Architecture

**Route groups.** `src/app/(tienda)` is the storefront (own shell: PromoBar/Navbar/Footer/CartDrawer/`CartSync`/`LiveRefresh`), `src/app/(admin)/admin` is the back office (products, stock, orders, coupons; Server Actions), and `login`/`registro`/`cuenta` live under `(tienda)`. Auth is a JWT cookie (`src/lib/auth.ts`, needs `JWT_SECRET` ≥ 32 chars) gated in `src/middleware.ts`.

**Data layer is Postgres, and the DB is the single source of truth.** `src/lib/db.ts` exports a cached `postgres` pool (`query`, `transaction`; raw parameterized SQL, rows returned as `unknown[]`). `src/lib/data.ts` maps `products`/`variants` rows to `src/types`. Prices, stock and variants come **only** from the DB: `products.json` only fills descriptive gaps (name/images/notes) of products that exist in the DB and is the seed source (`pnpm seed`, idempotent). There is no JSON fallback — products missing from the DB are not shown (they could not be bought), and DB errors propagate. Variants with a non-positive/NULL price are dropped, products left without variants are hidden, `discount_percent` is clamped to 0–100 and stock to ≥ 0; keep that invariant and always `ORDER BY`. Schema is in `docs/database/schema.sql` (portable plain-Postgres/Supabase, idempotent, CI runs it with `ON_ERROR_STOP`); `docs/database/migrations_price_numeric.sql` upgrades older DBs. Modules touching the DB or secrets import `"server-only"`.

**Fresh data.** Pages/sitemap are `force-dynamic` and `staleTimes` is 0 (`next.config.js`) so DB edits show on the next request; `LiveRefresh` calls `router.refresh()` on tab focus and every 30 s. `CartSync` (+ `src/lib/cart-sync.ts`, `POST /api/cart/sync`) re-reads price/stock/name from the DB on load, focus, every 30 s and before paying (`cartStore.applyServerState`; checkout pages abort with a message if the cart changed). Do not add a `loading.tsx` above `productos/[slug]`: it makes `notFound()` answer 200 (soft 404); hidden/deleted products must return a real 404 (`generateMetadata` throws `notFound()`).

**Env validation:** `src/lib/env.ts` validates all required vars with zod at import time and `process.exit(1)`s on failure; it is skipped under `VITEST` (tests call `loadEnv()` directly). So any new required env var must be added to the schema, `.env.local.example`, and the CI workflow env blocks.

**Pricing and payment (the multi-file piece).** `src/lib/pricing.ts` is the single server-side source for what is charged: unit price = variant price with `discount_percent` (`applyDiscount`/`getUnitPriceCents` in `src/lib/utils.ts`), then multi-buy bundles for 70 ml/35 € Chogan perfumes (2 → 63 €, 3 → 84 €), then the server-side coupon (`SILLAGE2`, −10 %, `src/lib/coupons.ts`/`coupon-store.ts`), all in integer cents; then **shipping**: 5 € flat, free from 50 € on that total, peninsular Spain only (`getShippingCents`, constants in `src/lib/constants.ts`). The UI (`cartStore.getDiscountedTotal`, cart drawer, `/carrito`, `/checkout`) mirrors the same rules.
1. `api/stripe/checkout`: re-prices from the DB (never trusts client prices), merges duplicate lines, checks stock (409), charges the priced lines, adds a Stripe shipping rate, stores items in chunked metadata (`src/lib/order-metadata.ts`, Stripe caps values at 500 chars) plus `couponCode`.
2. `api/stripe/webhook`: verifies the signature, then re-derives the expected total from the DB (`expectedTotalCents`) and checks `amount_total − amount_shipping` and the shipping amount; Stripe promotion codes are accepted only if `total_details.amount_discount` explains the difference. Non-peninsular postal codes (07/35/38/51/52, read from `shipping_details` or `collected_information.shipping_details` depending on the Stripe API version) are logged for manual refund. `charge.refunded` marks the order refunded via `order_data.paymentIntent`. The webhook is not rate limited.
3. `api/checkout/cod` (cash on delivery) applies the same checks: total incl. shipping, stock, non-peninsular postal codes rejected.
4. `saveOrder` (`src/lib/data/orders.ts`) is idempotent on `stripe_event_id` **and** `stripe_session_id` and decrements stock atomically in one transaction (`UPDATE variants … WHERE variant_id = $2 AND stock >= $n`; rollback if short). `order_data` is inserted with `($7::text)::jsonb` because postgres.js double-encodes a JSON string bound to a jsonb param (stored as a JSON string, breaking `items`/refund lookups). The variant PK column is `variant_id`.
5. `api/stripe/session` backs `/checkout/success` (only clears the cart when `payment_status === "paid"`).

**Middleware (`src/middleware.ts`):** runs the auth gate (`/cuenta`, `/admin`), then rate limits `/api/auth/*` (5/min), `/api/stripe/*` except the webhook (10/min; the webhook is signature-authenticated and called by Stripe's shared IPs) and `/api/search` + `/api/cart/*` (30/min) via Upstash sliding window, falling back to an in-memory map; also generates a per-request CSP nonce (`x-nonce` header) and sets the `Content-Security-Policy` header. New third-party scripts/images/frames/connections must be allowed in `buildCSP`. Static security headers and the legacy product slug redirects live in `next.config.js`; remote images are limited to `images.unsplash.com`.

**Client state:** Zustand stores in `src/store` (`cartStore`, `wishlistStore`) persisted to localStorage. The cart is keyed by product + variant (size). Server components fetch via `src/lib/data.ts`; interactive pieces (cart drawer, search overlay, filters, add-to-cart) are client components, often wrapped (`*Wrapper.tsx`).

**Repo extras:** `src/hooks/pre-commit` is a secret-scanning git hook (install by symlinking into `.git/hooks`; note the path comment inside it is outdated). `.agents/skills/` and `.atl/` hold agent skill definitions/registry, and `docs/design/` holds design prompts and reference screenshots — none are part of the app.
