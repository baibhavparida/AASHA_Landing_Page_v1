/*
  # Add to_number field for Retell API integration
  Adds to_number column auto-generated from country_code + phone_number.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'to_number'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN to_number text;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.to_number := NEW.country_code || regexp_replace(NEW.phone_number, '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_to_number_trigger ON elderly_profiles;
CREATE TRIGGER generate_to_number_trigger
  BEFORE INSERT OR UPDATE OF phone_number, country_code ON elderly_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_to_number();

UPDATE elderly_profiles
SET to_number = country_code || regexp_replace(phone_number, '[^0-9]', '', 'g')
WHERE to_number IS NULL OR to_number = '';

CREATE INDEX IF NOT EXISTS idx_elderly_profiles_to_number ON elderly_profiles(to_number);

COMMENT ON COLUMN elderly_profiles.to_number IS 'Complete phone number for Retell API in format: country_code + phone_number (e.g., +12025551234)';
