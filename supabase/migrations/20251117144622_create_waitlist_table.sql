/*
  # Create waitlist table

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key) - Unique identifier for each waitlist entry
      - `full_name` (text) - Full name of the person joining the waitlist
      - `phone` (text) - Mobile phone number
      - `email` (text) - Email address
      - `created_at` (timestamptz) - Timestamp when the person joined the waitlist
      
  2. Security
    - Enable RLS on `waitlist` table
    - Add policy for anonymous users to insert their own data (for waitlist signup)
    - Add policy for authenticated users to view all waitlist entries (for admin access)

  3. Notes
    - Email and phone are both captured to give users flexibility
    - Timestamps help track when people joined the waitlist
    - Anonymous insert is allowed so users can sign up without authentication
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to insert into waitlist
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view waitlist entries (for admin purposes)
CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);