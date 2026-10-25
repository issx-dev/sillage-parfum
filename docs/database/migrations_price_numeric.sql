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
