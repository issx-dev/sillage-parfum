-- Price/consistency migration for existing databases. Safe to re-run.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Cent-precision prices (was INTEGER, whole euros only).
-- The app reads the column as `price::float8`, since postgres.js returns NUMERIC as string.
ALTER TABLE variants
  ALTER COLUMN price TYPE NUMERIC(10,2) USING price::numeric(10,2);

-- Fix rows that would break the constraints below before adding them:
--   SELECT variant_id, price, stock FROM variants WHERE price <= 0 OR stock < 0;
--   SELECT product_id, discount_percent FROM products WHERE discount_percent NOT BETWEEN 0 AND 100;
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_price_positive;
ALTER TABLE variants ADD CONSTRAINT variants_price_positive CHECK (price > 0);
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_stock_nonnegative;
ALTER TABLE variants ADD CONSTRAINT variants_stock_nonnegative CHECK (stock >= 0);
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_size_positive;
ALTER TABLE variants ADD CONSTRAINT variants_size_positive CHECK (size_ml > 0);
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_discount_range;
ALTER TABLE products ADD CONSTRAINT products_discount_range CHECK (discount_percent BETWEEN 0 AND 100);

-- Coupons (backoffice /admin/cupones; read by the checkout via coupon-store.ts).
-- The DB wins over the in-code fallback: a coupon that is not here (or inactive) is invalid,
-- so the two coupons the storefront advertises are seeded below.
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY CHECK (code = upper(code) AND length(code) BETWEEN 3 AND 24),
  percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    DROP POLICY IF EXISTS "Service role can manage coupons" ON coupons;
    CREATE POLICY "Service role can manage coupons" ON coupons FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO coupons (code, percent_off, first_order_only) VALUES
  ('SILLAGE2', 10, FALSE),
  ('BIENVENIDA10', 10, TRUE)
ON CONFLICT (code) DO NOTHING;
