/*
# Migrate to live Supabase backend schema

1. Changes
- Conditionally drop old products/orders tables (only if they have old template schema with 'category' column)
- Create categories table (id, name, slug) for dynamic category navigation
- Create products table: id, name, category_name, mrp, selling_price, discount_percentage, unit, in_stock, stock_quantity, image_url, created_at
- Create orders table: id, customer_name, phone, address_line, area, city, pincode, items (JSONB), total_amount, delivery_fee, payment_method, order_status, created_at
- Create public storage bucket 'product' for product image uploads
- Seed 5 categories and 16 sample products

2. Security
- RLS enabled on categories, products, orders
- categories: public SELECT (anon + authenticated)
- products: full CRUD for anon + authenticated (admin manages via direct Supabase client)
- orders: public INSERT (customers place orders), SELECT + UPDATE for anon (admin reads/updates via direct client)
- Storage bucket 'product': public read, anon upload/update/delete

3. Notes
- Admin auth remains via edge function (JWT-based login at /auth/login only)
- All product/order CRUD uses direct Supabase client queries
- Order items stored as JSONB array of {name, quantity, price}
- Order status values: 'Received', 'Packed', 'Out for Delivery', 'Delivered'
- Migration is idempotent: safe to re-run
*/

-- Conditionally drop old tables (only if they have old schema with 'category' column)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
  END IF;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

-- Create products table (matches live backend schema)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_name text NOT NULL,
  mrp numeric(10, 2) NOT NULL CHECK (mrp > 0),
  selling_price numeric(10, 2) NOT NULL CHECK (selling_price > 0),
  discount_percentage numeric(5, 2) NOT NULL DEFAULT 15,
  unit text DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create orders table (matches live backend schema)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  area text DEFAULT '',
  city text NOT NULL DEFAULT 'Ahmedabad',
  pincode text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10, 2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash on Delivery',
  order_status text NOT NULL DEFAULT 'Received' CHECK (order_status IN ('Received', 'Packed', 'Out for Delivery', 'Delivered')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_name ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Categories: public read
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Products: public CRUD (admin manages via direct Supabase client)
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_products" ON products;
CREATE POLICY "public_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_products" ON products;
CREATE POLICY "public_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_products" ON products;
CREATE POLICY "public_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Orders: public insert (customers), anon select/update (admin)
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_orders" ON orders;
CREATE POLICY "public_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product', 'product', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, anon upload/update/delete
DROP POLICY IF EXISTS "Public read product bucket" ON storage.objects;
CREATE POLICY "Public read product bucket" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product');

DROP POLICY IF EXISTS "Public upload product bucket" ON storage.objects;
CREATE POLICY "Public upload product bucket" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product');

DROP POLICY IF EXISTS "Public update product bucket" ON storage.objects;
CREATE POLICY "Public update product bucket" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'product') WITH CHECK (bucket_id = 'product');

DROP POLICY IF EXISTS "Public delete product bucket" ON storage.objects;
CREATE POLICY "Public delete product bucket" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'product');

-- Seed categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories) THEN
    INSERT INTO categories (name, slug) VALUES
      ('Allopathic', 'allopathic'),
      ('Ayurvedic', 'ayurvedic'),
      ('Cosmetics', 'cosmetics'),
      ('Provisional', 'provisional'),
      ('Surgical', 'surgical');
  END IF;
END $$;

-- Seed sample products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM products) THEN
    INSERT INTO products (name, category_name, mrp, selling_price, discount_percentage, unit, in_stock, stock_quantity, image_url) VALUES
      ('Dolo 650', 'Allopathic', 30.00, 25.50, 15, 'Strip of 15 Tablets', true, 50, ''),
      ('Crocin Advance', 'Allopathic', 35.00, 29.75, 15, 'Strip of 15 Tablets', true, 40, ''),
      ('Azithromycin 500', 'Allopathic', 120.00, 102.00, 15, 'Strip of 5 Tablets', true, 25, ''),
      ('Pantop DSR', 'Allopathic', 95.00, 80.75, 15, 'Strip of 10 Capsules', true, 30, ''),
      ('Chyawanprash', 'Ayurvedic', 545.00, 463.25, 15, '1kg Jar', true, 20, ''),
      ('Ashwagandha Capsules', 'Ayurvedic', 450.00, 382.50, 15, 'Bottle of 60', true, 15, ''),
      ('Triphala Churna', 'Ayurvedic', 180.00, 153.00, 15, '200g Pack', true, 35, ''),
      ('Dove Shampoo', 'Cosmetics', 345.00, 293.25, 15, '340ml Bottle', true, 28, ''),
      ('Nivea Body Lotion', 'Cosmetics', 399.00, 339.15, 15, '400ml Bottle', true, 22, ''),
      ('Lakme Sunscreen SPF 50', 'Cosmetics', 750.00, 637.50, 15, '50ml Tube', true, 18, ''),
      ('Aashirvaad Atta', 'Provisional', 515.00, 437.75, 15, '10kg Bag', true, 12, ''),
      ('Tata Salt', 'Provisional', 28.00, 23.80, 15, '1kg Pack', true, 100, ''),
      ('Fortune Sunflower Oil', 'Provisional', 165.00, 140.25, 15, '1L Bottle', true, 45, ''),
      ('Disposable Mask', 'Surgical', 250.00, 212.50, 15, 'Pack of 50', true, 60, ''),
      ('Hand Sanitizer', 'Surgical', 199.00, 169.15, 15, '500ml Bottle', true, 55, ''),
      ('Digital Thermometer', 'Surgical', 150.00, 127.50, 15, '1 Unit', true, 30, '');
  END IF;
END $$;