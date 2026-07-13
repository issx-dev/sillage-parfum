/**
 * Seed script: reads `src/lib/data/products.json` and inserts all products
 * and their variants into the PostgreSQL `products` and `variants` tables.
 *
 * Idempotent: every INSERT uses `ON CONFLICT (...) DO NOTHING` so re-running
 * the script on an already-seeded database is safe and produces no duplicates.
 *
 * Usage:  pnpm seed   (maps to `tsx src/scripts/seed.ts`)
 */

import { query } from "@/lib/db";
import productsData from "@/lib/data/products.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Element type of the imported products.json (inferred by TypeScript). */
type ProductJson = (typeof productsData)[number];

export interface SeedSummary {
  productsInserted: number;
  productsSkipped: number;
  variantsInserted: number;
  variantsSkipped: number;
}

/**
 * Pure mapping of a single product JSON object to the SQL string + bound
 * parameter arrays needed for one product INSERT and N variant INSERTs.
 *
 * Notes arrays (top / heart / base) and images are passed as plain JS arrays —
 * the `postgres` driver encodes them as PostgreSQL native `text[]` columns.
 */
export interface PreparedInserts {
  productSql: string;
  productParams: unknown[];
  variantSql: string;
  variantParamsList: unknown[][];
}

// ---------------------------------------------------------------------------
// SQL templates (constant — only the parameters change per row)
// ---------------------------------------------------------------------------

const PRODUCT_INSERT_SQL = `
  INSERT INTO products (
    product_id, slug, name, brand, family, gender,
    short_description, badge, images, discount_percent,
    notes_top, notes_heart, notes_base
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  ON CONFLICT (product_id) DO NOTHING
  RETURNING product_id
`.trim();

const VARIANT_INSERT_SQL = `
  INSERT INTO variants (
    variant_id, product_id, size_ml, price, stock, sku
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (variant_id) DO NOTHING
  RETURNING variant_id
`.trim();

// ---------------------------------------------------------------------------
// Pure mapping — zero side-effects, trivially testable
// ---------------------------------------------------------------------------

/**
 * Convert a single product from the JSON catalog into the SQL + parameter
 * arrays for its own INSERT plus every variant INSERT.
 *
 * The notes sub-arrays are passed through as JS arrays; the `postgres` driver
 * serialises them to PostgreSQL `text[]`.
 */
export function prepareInserts(product: ProductJson): PreparedInserts {
  return {
    productSql: PRODUCT_INSERT_SQL,
    productParams: [
      product.id,
      product.slug,
      product.name,
      product.brand,
      product.family,
      product.gender,
      product.shortDescription,
      product.badge,
      product.images,
      product.discount_percent,
      product.notes.top,
      product.notes.heart,
      product.notes.base,
    ],
    variantSql: VARIANT_INSERT_SQL,
    variantParamsList: product.variants.map((v) => [
      v.id,
      product.id,
      v.size_ml,
      v.price,
      v.stock,
      v.sku,
    ]),
  };
}

// ---------------------------------------------------------------------------
// Orchestration — iterates the catalog and issues all INSERTs
// ---------------------------------------------------------------------------

/**
 * Run the full seed against the database.  Safe to call multiple times —
 * `ON CONFLICT DO NOTHING` guarantees no duplicate rows are ever created.
 *
 * @returns counts of inserted / skipped rows for both products and variants.
 */
export async function runSeed(): Promise<SeedSummary> {
  let productsInserted = 0;
  let productsSkipped = 0;
  let variantsInserted = 0;
  let variantsSkipped = 0;

  for (const product of productsData) {
    const prepared = prepareInserts(product);

    const productResult = await query(prepared.productSql, prepared.productParams);
    if (productResult.length > 0) {
      productsInserted++;
    } else {
      productsSkipped++;
    }

    for (const variantParams of prepared.variantParamsList) {
      const variantResult = await query(prepared.variantSql, variantParams);
      if (variantResult.length > 0) {
        variantsInserted++;
      } else {
        variantsSkipped++;
      }
    }
  }

  return { productsInserted, productsSkipped, variantsInserted, variantsSkipped };
}

// ---------------------------------------------------------------------------
// CLI formatting + entry-point
// ---------------------------------------------------------------------------

/**
 * Format a {@link SeedSummary} into a human-readable one-liner.
 */
export function formatSummary(summary: SeedSummary): string {
  const { productsInserted, productsSkipped, variantsInserted, variantsSkipped } =
    summary;
  return (
    `Seed complete: ${productsInserted} products inserted ` +
    `(${productsSkipped} skipped), ` +
    `${variantsInserted} variants inserted (${variantsSkipped} skipped)`
  );
}

/**
 * CLI entry-point.  Reads the catalog, inserts all rows, prints the summary
 * and exits with code 0 on success or 1 on failure.
 */
async function main(): Promise<void> {
  try {
    const summary = await runSeed();
    console.log(formatSummary(summary));
    process.exit(0);
  } catch (error) {
    console.error("[seed] Failed to seed database:", error);
    process.exit(1);
  }
}

// Auto-run only when executed as a script (`tsx src/scripts/seed.ts`),
// NOT when imported by vitest (which sets `process.env.VITEST`).
if (!process.env.VITEST) {
  void main();
}