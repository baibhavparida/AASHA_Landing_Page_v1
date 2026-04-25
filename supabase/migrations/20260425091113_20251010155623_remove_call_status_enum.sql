/*
  # Remove call_status enum and change to text, remove started_at, change call_type to text, make fields nullable
*/

-- Change call_status from enum to text
ALTER TABLE calls ALTER COLUMN call_status TYPE text;

-- Drop enum types if they exist (safe to ignore if in use elsewhere)
DROP TYPE IF EXISTS call_status_enum CASCADE;

-- Remove started_at column
ALTER TABLE calls DROP COLUMN IF EXISTS started_at;

-- Change call_type from enum to text
ALTER TABLE calls ALTER COLUMN call_type TYPE text;
DROP TYPE IF EXISTS call_type_enum CASCADE;

-- Make retell_call_id nullable and call_status nullable for pre-population
ALTER TABLE calls ALTER COLUMN retell_call_id DROP NOT NULL;
ALTER TABLE calls ALTER COLUMN call_status DROP NOT NULL;
