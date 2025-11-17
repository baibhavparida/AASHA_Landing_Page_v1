/*
  # Allow anonymous users to check for duplicate waitlist entries

  1. Changes
    - Add SELECT policy for anonymous users to check if they're already registered
    - This allows the duplicate check in the waitlist form to work properly
  
  2. Security
    - Policy allows anonymous users to read waitlist entries
    - This is necessary for duplicate detection on the public form
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'waitlist' 
    AND policyname = 'Anyone can check waitlist duplicates'
  ) THEN
    CREATE POLICY "Anyone can check waitlist duplicates"
      ON waitlist
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
