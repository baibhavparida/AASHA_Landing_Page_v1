/*
  # Retell Voice AI Call Management System
  Creates calls, call_analysis, call_transcripts, call_costs, and daily_medicine_log tables with RLS.
*/

-- Create call_type enum
DO $$ BEGIN
  CREATE TYPE call_type_enum AS ENUM ('onboarding', 'daily_checkin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create call_status enum
DO $$ BEGIN
  CREATE TYPE call_status_enum AS ENUM ('successful', 'voicemail', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id text UNIQUE NOT NULL,
  elderly_profile_id uuid NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  call_type call_type_enum NOT NULL,
  call_status call_status_enum NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  agent_id text,
  access_token text,
  access_token_expires_at timestamptz,
  raw_webhook_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create call_analysis table
CREATE TABLE IF NOT EXISTS call_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  call_summary text NOT NULL DEFAULT '',
  user_sentiment text CHECK (user_sentiment IN ('Positive', 'Negative', 'Neutral')),
  call_successful boolean NOT NULL DEFAULT false,
  in_voicemail boolean NOT NULL DEFAULT false,
  medicine_taken boolean,
  custom_analysis_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create call_transcripts table with 180-day expiration
CREATE TABLE IF NOT EXISTS call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  transcript_text text,
  speaker_segments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '180 days')
);

-- Create call_costs table
CREATE TABLE IF NOT EXISTS call_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  combined_cost decimal(10, 4) DEFAULT 0,
  llm_tokens_used integer DEFAULT 0,
  llm_average_tokens integer DEFAULT 0,
  llm_num_requests integer DEFAULT 0,
  llm_token_values jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create daily_medicine_log table
CREATE TABLE IF NOT EXISTS daily_medicine_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id uuid NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  medicine_taken boolean NOT NULL DEFAULT false,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  logged_at timestamptz DEFAULT now(),
  UNIQUE (elderly_profile_id, log_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calls_elderly_profile_id ON calls(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_calls_retell_call_id ON calls(retell_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_type_started_at ON calls(call_type, started_at);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);
CREATE INDEX IF NOT EXISTS idx_call_analysis_call_id ON call_analysis(call_id);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_expires_at ON call_transcripts(expires_at);
CREATE INDEX IF NOT EXISTS idx_call_costs_call_id ON call_costs(call_id);
CREATE INDEX IF NOT EXISTS idx_daily_medicine_log_profile_date ON daily_medicine_log(elderly_profile_id, log_date);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_medicine_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls table
CREATE POLICY "Users can view calls for their elderly profiles"
  ON calls FOR SELECT TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can insert calls for their elderly profiles"
  ON calls FOR INSERT TO authenticated
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can update calls for their elderly profiles"
  ON calls FOR UPDATE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()))
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can delete calls for their elderly profiles"
  ON calls FOR DELETE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

-- RLS Policies for call_analysis table
CREATE POLICY "Users can view call analysis for their elderly profiles"
  ON call_analysis FOR SELECT TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can insert call analysis for their elderly profiles"
  ON call_analysis FOR INSERT TO authenticated
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can update call analysis for their elderly profiles"
  ON call_analysis FOR UPDATE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())))
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can delete call analysis for their elderly profiles"
  ON call_analysis FOR DELETE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

-- RLS Policies for call_transcripts table
CREATE POLICY "Users can view call transcripts for their elderly profiles"
  ON call_transcripts FOR SELECT TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can insert call transcripts for their elderly profiles"
  ON call_transcripts FOR INSERT TO authenticated
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can update call transcripts for their elderly profiles"
  ON call_transcripts FOR UPDATE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())))
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can delete call transcripts for their elderly profiles"
  ON call_transcripts FOR DELETE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

-- RLS Policies for call_costs table
CREATE POLICY "Users can view call costs for their elderly profiles"
  ON call_costs FOR SELECT TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can insert call costs for their elderly profiles"
  ON call_costs FOR INSERT TO authenticated
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can update call costs for their elderly profiles"
  ON call_costs FOR UPDATE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())))
  WITH CHECK (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

CREATE POLICY "Users can delete call costs for their elderly profiles"
  ON call_costs FOR DELETE TO authenticated
  USING (call_id IN (SELECT id FROM calls WHERE elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid())));

-- RLS Policies for daily_medicine_log table
CREATE POLICY "Users can view medicine log for their elderly profiles"
  ON daily_medicine_log FOR SELECT TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can insert medicine log for their elderly profiles"
  ON daily_medicine_log FOR INSERT TO authenticated
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can update medicine log for their elderly profiles"
  ON daily_medicine_log FOR UPDATE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()))
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can delete medicine log for their elderly profiles"
  ON daily_medicine_log FOR DELETE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-delete expired transcripts
CREATE OR REPLACE FUNCTION delete_expired_transcripts()
RETURNS void AS $$
BEGIN
  DELETE FROM call_transcripts WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
