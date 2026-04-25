/*
  # Add elderly_profile_id to Profiles Table
  Adds bidirectional FK from profiles to elderly_profiles.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS elderly_profile_id uuid
  REFERENCES elderly_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_elderly_profile_id ON profiles(elderly_profile_id);

COMMENT ON COLUMN profiles.elderly_profile_id IS 'Links to the associated elderly_profiles record.';
