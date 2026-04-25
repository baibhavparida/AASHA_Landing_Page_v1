/*
  # Add LLM Call Summary to Call Transcripts
  Adds llm_call_summary column to store Retell's AI-generated summary.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_transcripts' AND column_name = 'llm_call_summary'
  ) THEN
    ALTER TABLE call_transcripts ADD COLUMN llm_call_summary text;
  END IF;
END $$;
