-- Allow cent-precision prices (was INTEGER, whole euros only).
-- The app reads the column as `price::float8`, since postgres.js returns NUMERIC as string.
ALTER TABLE variants
  ALTER COLUMN price TYPE NUMERIC(10,2) USING price::numeric(10,2);
ALTER TABLE variants
  ADD CONSTRAINT variants_price_nonnegative CHECK (price >= 0);
