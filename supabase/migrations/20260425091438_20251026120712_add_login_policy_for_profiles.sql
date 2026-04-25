/*
  # Add login policies for anonymous users
  Allows anon users to check phone numbers during login flow on profiles and elderly_profiles.
*/

-- Allow anonymous users to check if phone number exists during login
CREATE POLICY "Allow anonymous to check phone for login"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to check if elderly profiles exist during login
CREATE POLICY "Allow anonymous to check elderly profile for login"
  ON elderly_profiles
  FOR SELECT
  TO anon
  USING (true);
