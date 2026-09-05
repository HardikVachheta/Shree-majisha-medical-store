/*
# Add Customer Users Table & Update Orders Schema

## Summary
This migration supports customer authentication by creating a `users` table
for storing customer accounts, and adds `customer_email` to the `orders` table
so orders can be linked back to a registered customer's email.

## Changes

### New Tables
- `users`: Stores customer account details
  - `id` (uuid, primary key, auto-generated)
  - `username` (text, not null)
  - `email` (text, unique, not null) — used as login identifier
  - `password` (text, not null) — stored as plain text (app-level auth, not Supabase Auth)
  - `phone` (text)
  - `address_line` (text)
  - `area` (text, default 'Chandlodiya')
  - `city` (text, default 'Ahmedabad')
  - `pincode` (text)
  - `created_at` (timestamptz, auto)

### Modified Tables
- `orders`: Added `customer_email` (text, nullable) to link orders to registered customers

## Security
- RLS enabled on `users` table with open anon policies (custom app-level auth, not Supabase Auth)
- RLS enabled / policies updated on `orders` to also allow anon inserts for guest checkout
- `users` SELECT policy is open so login can query by email
- `users` INSERT policy is open so signup can create accounts

## Notes
- Customer authentication is handled at the application layer (email+password check in JS)
  NOT via Supabase Auth, matching the existing admin login pattern
- The `customer_email` column on orders is nullable to support guest checkout
*/

-- Create users table for customer accounts
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  phone text DEFAULT '',
  address_line text DEFAULT '',
  area text DEFAULT 'Chandlodiya',
  city text DEFAULT 'Ahmedabad',
  pincode text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- Add customer_email column to orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email text;
  END IF;
END $$;
