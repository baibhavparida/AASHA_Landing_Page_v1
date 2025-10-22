/*
  # Telegram Integration Schema for Elderly Care System

  This migration adds comprehensive Telegram messaging support as a supplementary channel
  alongside voice calls for medicine reminders, onboarding welcome messages, interest-based
  conversations, and event reminders.

  ## Changes to Existing Tables

  ### `elderly_profiles` - Add Telegram Integration Fields
  - `telegram_chat_id` (text, nullable) - Telegram chat ID for direct messaging
  - `telegram_username` (text, nullable) - Telegram username for reference
  - `telegram_enabled` (boolean, default false) - Opt-in status for Telegram messaging
  - `telegram_onboarded_at` (timestamptz, nullable) - When welcome message was sent
  - `telegram_language_code` (text, nullable) - Telegram language preference (en/hi)

  ## New Tables

  ### `telegram_message_queue`
  Message queue for scheduled Telegram messages with delivery tracking.
  - `id` (uuid, primary key) - Unique message identifier
  - `elderly_profile_id` (uuid, references elderly_profiles.id) - Target elderly user
  - `message_type` (text, not null) - Type of message being sent
  - `message_content` (text, not null) - Actual message text to send
  - `scheduled_for` (timestamptz, not null) - When to send the message
  - `related_entity_type` (text, nullable) - Type of related entity
  - `related_entity_id` (uuid, nullable) - Reference to related entity
  - `status` (text, default 'pending') - Message delivery status
  - `sent_at` (timestamptz, nullable) - When message was actually sent
  - `delivery_error` (text, nullable) - Error message if delivery failed
  - `retry_count` (integer, default 0) - Number of retry attempts
  - `metadata` (jsonb, default '{}') - Additional context data
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `telegram_logs`
  Complete log of all Telegram messages sent and received.
  - `id` (uuid, primary key) - Unique log entry identifier
  - `elderly_profile_id` (uuid, references elderly_profiles.id) - Elderly user involved
  - `message_direction` (text, not null) - 'sent' or 'received'
  - `message_type` (text, not null) - Category of message
  - `message_text` (text) - Message content
  - `related_entity_type` (text, nullable) - Type of related entity
  - `related_entity_id` (uuid, nullable) - Reference to related entity
  - `telegram_message_id` (text, nullable) - Telegram's unique message ID
  - `ai_reply` (boolean, default false) - Whether message was AI-generated
  - `user_acknowledged` (boolean, default false) - Whether user responded
  - `sentiment` (text, nullable) - Detected sentiment of message
  - `sent_at` (timestamptz, default now()) - When message was sent/received
  - `delivered_at` (timestamptz, nullable) - When Telegram confirmed delivery
  - `read_at` (timestamptz, nullable) - When user read the message
  - `metadata` (jsonb, default '{}') - Additional structured data

  ### `telegram_medicine_reminders`
  Scheduled medicine reminders via Telegram.
  - `id` (uuid, primary key) - Unique reminder identifier
  - `medication_id` (uuid, references medications.id, not null) - Medication to remind about
  - `elderly_profile_id` (uuid, references elderly_profiles.id, not null) - Target elderly user
  - `reminder_time` (time, not null) - Daily time to send reminder
  - `days_of_week` (text array, default all days) - Which days to send
  - `is_active` (boolean, default true) - Can be disabled without deletion
  - `last_sent_at` (timestamptz, nullable) - When last reminder was sent
  - `reminder_template` (text, not null) - Message template with variables
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Elderly users can access their own data
  - Caregivers can access data for elderly profiles they manage
  - Service role has elevated permissions for webhook operations

  ## Indexes

  Performance indexes for common query patterns:
  - Message queue status and scheduling queries
  - Log lookups by user and entity
  - Reminder scheduling and active status queries

  ## Notes
  - Telegram is a supplementary channel alongside voice calls
  - Only one-on-one conversations with elderly users (no family members in MVP)
  - Bilingual support for English and Hindi
  - Message templates stored with language keys
  - 180-day retention for telegram_logs (matching call_transcripts)
  - 30-day retention for completed/failed messages in telegram_message_queue
*/

-- Add Telegram fields to elderly_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_chat_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_enabled'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_onboarded_at'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_onboarded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles' AND column_name = 'telegram_language_code'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN telegram_language_code text CHECK (telegram_language_code IN ('en', 'hi'));
  END IF;
END $$;

-- Create telegram_message_queue table
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

-- Create telegram_logs table
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

-- Create telegram_medicine_reminders table
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

-- Create indexes for telegram_message_queue
CREATE INDEX IF NOT EXISTS idx_telegram_queue_elderly_profile ON telegram_message_queue(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_scheduled_status ON telegram_message_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_status_scheduled ON telegram_message_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_telegram_queue_related_entity ON telegram_message_queue(related_entity_type, related_entity_id);

-- Create indexes for telegram_logs
CREATE INDEX IF NOT EXISTS idx_telegram_logs_elderly_profile ON telegram_logs(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_sent_at ON telegram_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_related_entity ON telegram_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_direction_type ON telegram_logs(message_direction, message_type);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_telegram_message_id ON telegram_logs(telegram_message_id);

-- Create indexes for telegram_medicine_reminders
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_elderly_profile ON telegram_medicine_reminders(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_medication ON telegram_medicine_reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_active ON telegram_medicine_reminders(is_active, elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reminders_time ON telegram_medicine_reminders(reminder_time, is_active);

-- Enable Row Level Security
ALTER TABLE telegram_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_medicine_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_message_queue table
CREATE POLICY "Users can view message queue for their elderly profiles"
  ON telegram_message_queue FOR SELECT
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their elderly profiles"
  ON telegram_message_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update message queue for their elderly profiles"
  ON telegram_message_queue FOR UPDATE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages for their elderly profiles"
  ON telegram_message_queue FOR DELETE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

-- RLS Policies for telegram_logs table
CREATE POLICY "Users can view telegram logs for their elderly profiles"
  ON telegram_logs FOR SELECT
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert telegram logs for their elderly profiles"
  ON telegram_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update telegram logs for their elderly profiles"
  ON telegram_logs FOR UPDATE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete telegram logs for their elderly profiles"
  ON telegram_logs FOR DELETE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

-- RLS Policies for telegram_medicine_reminders table
CREATE POLICY "Users can view medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR SELECT
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR UPDATE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medicine reminders for their elderly profiles"
  ON telegram_medicine_reminders FOR DELETE
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles
      WHERE profile_id = auth.uid() OR caregiver_profile_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_telegram_message_queue_updated_at
  BEFORE UPDATE ON telegram_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_medicine_reminders_updated_at
  BEFORE UPDATE ON telegram_medicine_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-delete old telegram logs (180-day retention)
CREATE OR REPLACE FUNCTION delete_old_telegram_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_logs
  WHERE sent_at < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to purge completed/failed messages from queue (30-day retention)
CREATE OR REPLACE FUNCTION purge_old_telegram_queue_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_message_queue
  WHERE status IN ('sent', 'delivered', 'failed', 'cancelled')
  AND updated_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
