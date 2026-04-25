/*
  # Add Retell Webhook Tracking to Calls Table
  Adds retell_webhook_received boolean column to prevent duplicate webhook processing.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calls' AND column_name = 'retell_webhook_received'
  ) THEN
    ALTER TABLE calls ADD COLUMN retell_webhook_received boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calls_retell_call_id ON calls(retell_call_id);
