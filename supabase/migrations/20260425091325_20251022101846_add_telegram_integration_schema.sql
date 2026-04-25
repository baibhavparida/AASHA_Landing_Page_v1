/*
  # Telegram Integration Schema
  Adds telegram fields to elderly_profiles and creates telegram_message_queue, telegram_logs, and telegram_medicine_reminders tables.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_chat_id') THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_chat_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_username') THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_username text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_enabled') THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_onboarded_at') THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_onboarded_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_language_code') THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_language_code text CHECK (telegram_language_code IN ('en', 'hi'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS telegram_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id uuid NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('onboarding_welcome', 'medicine_reminder', 'interest_conversation', 'event_reminder', 'daily_greeting')),
  message_content text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  related_entity_type text CHECK (related_entity_type IN ('medication', 'interest', 'special_event', 'conversation_prompt')),
  related_entity_id uuid,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  sent_at timestamptz,
  delivery_error text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telegram_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id uuid NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  message_direction text NOT NULL CHECK (message_direction IN ('sent', 'received')),
  message_type text NOT NULL CHECK (message_type IN ('onboarding_welcome', 'medicine_reminder', 'interest_conversation', 'event_reminder', 'daily_greeting', 'user_message', 'ai_response')),
  message_text text,
  related_entity_type text CHECK (related_entity_type IN ('medication', 'interest', 'special_event', 'conversation_prompt')),
  related_entity_id uuid,
  telegram_message_id text,
  ai_reply boolean DEFAULT false,
  user_acknowledged boolean DEFAULT false,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'confused')),
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS telegram_medicine_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  elderly_profile_id uuid NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  days_of_week text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  reminder_template text NOT NULL DEFAULT '{"en": "Time to take your medicine!", "hi": "अपनी दवा लेने का समय!"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_queue_elderly_profile ON telegram_message_queue(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_scheduled_status ON telegram_message_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_status_scheduled ON telegram_message_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_related_entity ON telegram_message_queue(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_elderly_profile ON telegram_logs(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_sent_at ON telegram_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_related_entity ON telegram_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_direction_type ON telegram_logs(message_direction, message_type);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_telegram_message_id ON telegram_logs(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_elderly_profile ON telegram_medicine_reminders(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_medication ON telegram_medicine_reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_active ON telegram_medicine_reminders(is_active, elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_time ON telegram_medicine_reminders(reminder_time, is_active);
CREATE INDEX IF NOT EXISTS idx_elderly_profiles_telegram_username ON elderly_profiles(telegram_username) WHERE telegram_username IS NOT NULL;

ALTER TABLE telegram_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_medicine_reminders ENABLE ROW LEVEL SECURITY;

-- RLS for telegram_message_queue
CREATE POLICY "Users can view message queue for their elderly profiles"
  ON telegram_message_queue FOR SELECT TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can insert messages for their elderly profiles"
  ON telegram_message_queue FOR INSERT TO authenticated
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can update message queue for their elderly profiles"
  ON telegram_message_queue FOR UPDATE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()))
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can delete messages for their elderly profiles"
  ON telegram_message_queue FOR DELETE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

-- RLS for telegram_logs
CREATE POLICY "Users can view telegram logs for their elderly profiles"
  ON telegram_logs FOR SELECT TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can insert telegram logs for their elderly profiles"
  ON telegram_logs FOR INSERT TO authenticated
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can update telegram logs for their elderly profiles"
  ON telegram_logs FOR UPDATE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()))
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can delete telegram logs for their elderly profiles"
  ON telegram_logs FOR DELETE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

-- RLS for telegram_medicine_reminders
CREATE POLICY "Users can view medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR SELECT TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can insert medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR INSERT TO authenticated
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can update medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR UPDATE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()))
  WITH CHECK (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

CREATE POLICY "Users can delete medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR DELETE TO authenticated
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_telegram_message_queue_updated_at
  BEFORE UPDATE ON telegram_message_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_medicine_reminders_updated_at
  BEFORE UPDATE ON telegram_medicine_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup functions
CREATE OR REPLACE FUNCTION delete_old_telegram_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_logs WHERE sent_at < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION purge_old_telegram_queue_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_message_queue
  WHERE status IN ('sent', 'delivered', 'failed', 'cancelled')
  AND updated_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
