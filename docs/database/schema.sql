-- SILLAGE Parfumerie: Orders Table Schema
-- Run this against your Supabase/PostgreSQL database before deploying.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT,
  customer_email TEXT NOT NULL,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  order_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by session ID
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders (stripe_session_id);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write orders
CREATE POLICY "Service role can manage orders"
  ON orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Products Table Schema
CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  family TEXT NOT NULL,
  gender TEXT NOT NULL,
  short_description TEXT NOT NULL,
  badge TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  discount_percent INTEGER NOT NULL DEFAULT 0,
  notes_top TEXT[] NOT NULL DEFAULT '{}',
  notes_heart TEXT[] NOT NULL DEFAULT '{}',
  notes_base TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

-- Enable Row Level Security for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to products, write only by service role
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Variants Table Schema
CREATE TABLE IF NOT EXISTS variants (
  variant_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  size_ml INTEGER NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants (product_id);

-- Enable Row Level Security for variants
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to variants, write only by service role
CREATE POLICY "Allow public read access to variants"
  ON variants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage variants"
  ON variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);