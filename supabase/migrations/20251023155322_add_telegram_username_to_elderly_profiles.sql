/*
  # Add Telegram Username to Elderly Profiles

  1. Changes
    - Add `telegram_username` column to `elderly_profiles` table
    - This field will store the Telegram username to match elderly users with their Telegram accounts
    - Field is optional (nullable) as not all elderly users may have Telegram accounts
  
  2. Notes
    - Telegram usernames are unique identifiers without the @ prefix
    - This will enable matching when elderly users interact via Telegram bot
    - The field will be collected during the onboarding flow
*/

-- Add telegram_username column to elderly_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_username text;
  END IF;
END $$;

-- Create index for faster lookups by telegram username
CREATE INDEX IF NOT EXISTS idx_elderly_profiles_telegram_username 
  ON elderly_profiles(telegram_username) 
  WHERE telegram_username IS NOT NULL;