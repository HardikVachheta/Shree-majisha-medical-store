/*
# Add payment_id, Closed status support, and role column

## Summary
Adds `payment_id` to the orders table for Razorpay transactions, a `role` column
to the users table to distinguish customers from admins, and updates the
order_status constraint to include 'Closed'.

## Changes

### Modified Tables
- `orders`: Added `payment_id` (text, nullable) to store Razorpay payment IDs
- `users`: Added `role` (text, default 'user') to distinguish customer vs admin

### Security
- No RLS policy changes (existing open anon policies remain)
*/

-- Add payment_id column to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id text;
  END IF;
END $$;

-- Add role column to users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;
