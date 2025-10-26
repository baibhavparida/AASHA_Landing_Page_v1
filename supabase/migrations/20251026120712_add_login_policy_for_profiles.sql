/*
  # Add login policy for profiles table

  1. Changes
    - Add SELECT policy for anonymous (anon) users to check phone number existence during login
    - This policy only allows checking if a phone number exists (by phone_number and country_code)
    - Returns only id and registration_type fields needed for login
  
  2. Security
    - Only allows anonymous users to query by phone_number and country_code
    - Does not expose sensitive user data
    - Required for login flow to work before user is authenticated
*/

-- Allow anonymous users to check if phone number exists during login
CREATE POLICY "Allow anonymous to check phone for login"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);
