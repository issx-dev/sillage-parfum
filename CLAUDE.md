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

**Data layer is Postgres, not JSON.** `src/lib/db.ts` exports a cached `postgres` pool (`query`, `transaction`; raw parameterized SQL, rows returned as `unknown[]` and cast by callers). `src/lib/data.ts` maps snake_case rows (`products`, `variants` tables) to the camelCase types in `src/types`; `brands.json` is the only static data still read directly. `products.json` is only the seed source. Schema (with RLS enabled) lives in `docs/database/schema.sql`. Modules that touch the DB or secrets import `"server-only"`.

**Database is the source of truth.** Pages/layout/sitemap are `force-dynamic` and `staleTimes` is 0 (`next.config.js`), so edits made directly in the DB show up on the next request; `LiveRefresh` calls `router.refresh()` on tab focus and every 30 s. The cart persists only what it needs: `CartSync` (+ `src/lib/cart-sync.ts`, `POST /api/cart/sync`) re-reads price/stock/name from the DB on load, focus, every 30 s and before paying (`cartStore.applyServerState`). `src/lib/data.ts` drops variants with a non-positive/NULL price and hides products left with no variants, clamps `discount_percent` to 0–100 and stock to ≥ 0; keep that invariant when adding queries (always `ORDER BY`). Stripe metadata values are capped at 500 chars, so order items are chunked via `src/lib/order-metadata.ts`.

**Env validation:** `src/lib/env.ts` validates all required vars with zod at import time and `process.exit(1)`s on failure; it is skipped under `VITEST` (tests call `loadEnv()` directly). So any new required env var must be added to the schema, `.env.local.example`, and the CI workflow env blocks.

**Payment flow (the multi-file piece):**
1. `api/stripe/checkout` receives only product/variant ids + quantities, re-prices from the DB via `getVariant` (never trusts client prices), checks stock (409 if short), charges the discounted unit price, adds a Stripe shipping rate, and stores items in `session.metadata.items`. Prices and shipping come from single helpers in `src/lib/utils.ts` (`getUnitPriceCents`, `applyDiscount`, `getShippingCents`) — use them everywhere a price is shown or charged. Shipping: 5 € flat, free from 50 € (`src/lib/constants.ts`), peninsular Spain only (Stripe can restrict only by country, so the webhook logs non-peninsular postal codes).
2. `api/stripe/webhook` verifies the signature, on `checkout.session.completed` re-checks `amount_subtotal` (pre-coupon) and the shipping amount against DB prices (discount applied), then calls `saveOrder` (`src/lib/data/orders.ts`).
3. `saveOrder` is an idempotent transaction: `INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING`, then atomic stock decrement (`UPDATE variants ... WHERE variant_id = $2 AND stock >= $n`); insufficient stock rolls back the whole transaction. Variant PK column is `variant_id` (not `id`); `variants.price` is `NUMERIC(10,2)` and must be selected as `price::float8` (see `docs/database/migrations_price_numeric.sql` for existing DBs).
4. `api/stripe/session` backs the `/checkout/success` page.

**Middleware (`src/middleware.ts`):** rate limits `/api/stripe/*` (10/min/IP) and `/api/search` (30/min/IP) via Upstash sliding window, falling back to an in-memory map; also generates a per-request CSP nonce (`x-nonce` header) and sets the `Content-Security-Policy` header. New third-party scripts/images/frames/connections must be allowed in `buildCSP`. Static security headers and the legacy product slug redirects live in `next.config.js`; remote images are limited to `images.unsplash.com`.

**Client state:** Zustand stores in `src/store` (`cartStore`, `wishlistStore`) persisted to localStorage. The cart is keyed by product + variant (size). Server components fetch via `src/lib/data.ts`; interactive pieces (cart drawer, search overlay, filters, add-to-cart) are client components, often wrapped (`*Wrapper.tsx`).

**Repo extras:** `src/hooks/pre-commit` is a secret-scanning git hook (install by symlinking into `.git/hooks`; note the path comment inside it is outdated). `.agents/skills/` and `.atl/` hold agent skill definitions/registry, and `docs/design/` holds design prompts and reference screenshots — none are part of the app.
