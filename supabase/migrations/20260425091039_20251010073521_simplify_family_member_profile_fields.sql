/*
  # Simplify Family Member Profile Fields
  Makes date_of_birth, gender, marital_status nullable and removes restrictive CHECK constraints.
*/

ALTER TABLE profiles ALTER COLUMN date_of_birth DROP NOT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE profiles ALTER COLUMN gender DROP NOT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_check;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marital_status_check;
ALTER TABLE profiles ALTER COLUMN marital_status DROP NOT NULL;
