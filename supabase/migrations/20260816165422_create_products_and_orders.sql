/*
# Create products and orders tables for Shree Majisha Medical Store

1. New Tables
- `products` — pharmacy/provision store catalog across 5 categories
  - id (uuid, PK)
  - name (text, not null)
  - category (text, not null) — one of: allopathic, ayurvedic, cosmetics, provisional, surgical
  - subcategory (text) — e.g. "Painkillers", "Chyawanprash", "Skin Care"
  - mrp (numeric, not null) — original maximum retail price in INR
  - selling_price (numeric, not null) — 15% discounted price = ROUND(mrp * 0.85, 2)
  - stock_qty (integer, not null, default 0)
  - unit (text) — e.g. "Strip of 10", "100ml Bottle"
  - image_url (text)
  - created_at (timestamptz, default now())
- `orders` — customer delivery orders placed from the storefront
  - id (uuid, PK)
  - customer_name (text, not null)
  - customer_phone (text, not null) — 10-digit Indian mobile
  - address (text, not null) — delivery address in Ahmedabad
  - landmark (text)
  - items (jsonb, not null) — array of {name, qty, mrp, selling_price}
  - subtotal (numeric, not null) — sum of MRP across items
  - savings (numeric, not null) — 15% discount amount
  - total (numeric, not null) — final payable after discount, delivery free
  - status (text, not null, default 'received') — received/packed/out_for_delivery/delivered
  - created_at (timestamptz, default now())

2. Security
- products: public SELECT (anon + authenticated) so storefront can browse.
  No INSERT/UPDATE/DELETE policies — admin writes go through edge function
  using the service role key which bypasses RLS.
- orders: public INSERT (anon + authenticated) so customers can place orders.
  No SELECT/UPDATE/DELETE to anon — admin reads/updates through edge function
  with service role key.

3. Indexes
- products: category index for filter queries
- orders: status + created_at indexes for admin dashboard
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('allopathic', 'ayurvedic', 'cosmetics', 'provisional', 'surgical')),
  subcategory text DEFAULT '',
  mrp numeric(10, 2) NOT NULL CHECK (mrp > 0),
  selling_price numeric(10, 2) NOT NULL CHECK (selling_price > 0),
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  unit text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address text NOT NULL,
  landmark text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  savings numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'packed', 'out_for_delivery', 'delivered')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- products: public read only
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products"
  ON products FOR SELECT
  TO anon, authenticated USING (true);

-- orders: public insert only (customers place orders)
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders"
  ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
