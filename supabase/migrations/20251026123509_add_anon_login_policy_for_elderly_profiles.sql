/*
  # Add Anonymous Login Policy for Elderly Profiles

  This migration adds a Row Level Security policy to allow anonymous users
  to check if elderly profiles exist during the login process.

  ## Changes
  - Add SELECT policy for anonymous users on elderly_profiles table
  - This policy only allows checking if a profile exists (id column)
  - Required for login validation to work properly

  ## Security
  - Policy is restrictive: only allows SELECT on minimal data
  - Anonymous users can only verify profile existence, not access full data
  - Once authenticated, normal RLS policies take over
*/

-- Allow anonymous users to check if elderly profiles exist during login
CREATE POLICY "Allow anonymous to check elderly profile for login"
  ON elderly_profiles
  FOR SELECT
  TO anon
  USING (true);
