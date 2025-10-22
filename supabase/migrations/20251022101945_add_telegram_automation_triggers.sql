/*
  # Telegram Automation Database Triggers

  This migration creates database triggers and functions to automate Telegram messaging
  workflows including welcome messages, medicine reminder creation, and response processing.

  ## Functions Created

  ### 1. `trigger_telegram_welcome_message()`
  Automatically sends welcome message when elderly_profile gets telegram_chat_id

  ### 2. `create_telegram_medicine_reminders_from_medication()`
  Auto-creates telegram reminder entries when medications are added

  ### 3. `process_telegram_user_response()`
  Processes incoming Telegram messages for medicine acknowledgments

  ### 4. `queue_daily_telegram_reminders()`
  Daily function to populate message queue with scheduled reminders

  ## Triggers Created

  1. After INSERT/UPDATE on elderly_profiles - Send welcome message
  2. After INSERT on medications - Create reminder schedules
  3. After INSERT on telegram_logs (received messages) - Process responses

  ## Notes

  - Triggers call n8n webhooks via http extension
  - Functions handle error cases gracefully
  - Medicine reminders created based on medication times_of_day
  - User responses parsed for medicine acknowledgment keywords
*/

-- Function to trigger telegram welcome message via n8n webhook
CREATE OR REPLACE FUNCTION trigger_telegram_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://sunitaai.app.n8n.cloud/webhook/telegram_welcome';
  profile_data jsonb;
BEGIN
  -- Only trigger if telegram_chat_id is newly set and not already onboarded
  IF NEW.telegram_chat_id IS NOT NULL 
     AND (OLD.telegram_chat_id IS NULL OR OLD.telegram_chat_id IS DISTINCT FROM NEW.telegram_chat_id)
     AND NEW.telegram_onboarded_at IS NULL THEN
    
    -- Build profile data for webhook
    profile_data := jsonb_build_object(
      'elderly_profile_id', NEW.id,
      'telegram_chat_id', NEW.telegram_chat_id,
      'telegram_username', NEW.telegram_username,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'language', NEW.language,
      'telegram_language_code', COALESCE(NEW.telegram_language_code, 'en')
    );

    -- Queue the welcome message
    INSERT INTO telegram_message_queue (
      elderly_profile_id,
      message_type,
      message_content,
      scheduled_for,
      status,
      metadata
    ) VALUES (
      NEW.id,
      'onboarding_welcome',
      CASE 
        WHEN COALESCE(NEW.telegram_language_code, 'en') = 'hi' 
        THEN 'नमस्ते ' || NEW.first_name || '! आशा में आपका स्वागत है। मैं आपका साथी हूं और आपसे हर दिन बात करूंगा।'
        ELSE 'Hello ' || NEW.first_name || '! Welcome to Aasha. I''m your companion and will chat with you every day.'
      END,
      now(),
      'pending',
      profile_data
    );

    -- Update telegram_onboarded_at timestamp
    NEW.telegram_onboarded_at := now();
    NEW.telegram_enabled := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create telegram medicine reminders when medication is added
CREATE OR REPLACE FUNCTION create_telegram_medicine_reminders_from_medication()
RETURNS TRIGGER AS $$
DECLARE
  time_of_day text;
  reminder_time time;
  reminder_template_en text;
  reminder_template_hi text;
  med_name text;
BEGIN
  -- Get medication name
  med_name := NEW.name;

  -- Create reminder for each time in times_of_day array
  FOREACH time_of_day IN ARRAY NEW.times_of_day
  LOOP
    -- Map time of day to actual time
    reminder_time := CASE time_of_day
      WHEN 'Morning' THEN '08:00:00'::time
      WHEN 'Afternoon' THEN '14:00:00'::time
      WHEN 'Evening' THEN '19:00:00'::time
      WHEN 'Night' THEN '21:00:00'::time
      ELSE '09:00:00'::time
    END;

    -- Build bilingual reminder templates
    reminder_template_en := 'Time to take your ' || med_name || ' (' || NEW.dosage_quantity::text || ' tablet' || 
                           CASE WHEN NEW.dosage_quantity > 1 THEN 's' ELSE '' END || '). Have you taken it?';
    
    reminder_template_hi := 'अपनी ' || med_name || ' (' || NEW.dosage_quantity::text || ' गोली' || 
                           CASE WHEN NEW.dosage_quantity > 1 THEN 'यां' ELSE '' END || ') लेने का समय। क्या आपने ले ली?';

    -- Insert telegram medicine reminder
    INSERT INTO telegram_medicine_reminders (
      medication_id,
      elderly_profile_id,
      reminder_time,
      is_active,
      reminder_template
    ) VALUES (
      NEW.id,
      NEW.elderly_profile_id,
      reminder_time,
      true,
      jsonb_build_object('en', reminder_template_en, 'hi', reminder_template_hi)::text
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to process telegram user responses for medicine acknowledgment
CREATE OR REPLACE FUNCTION process_telegram_user_response()
RETURNS TRIGGER AS $$
DECLARE
  response_lower text;
  is_medicine_ack boolean := false;
  today_date date := CURRENT_DATE;
BEGIN
  -- Only process received messages
  IF NEW.message_direction = 'received' AND NEW.message_text IS NOT NULL THEN
    response_lower := lower(NEW.message_text);

    -- Check for medicine acknowledgment keywords (English and Hindi)
    is_medicine_ack := (
      response_lower LIKE '%yes%' OR
      response_lower LIKE '%taken%' OR
      response_lower LIKE '%took%' OR
      response_lower LIKE '%done%' OR
      response_lower LIKE '%हां%' OR
      response_lower LIKE '%ली%' OR
      response_lower LIKE '%ले लिया%' OR
      response_lower LIKE '%खा लिया%' OR
      response_lower = 'y' OR
      response_lower = 'yes' OR
      response_lower = 'ok'
    );

    -- If it's a medicine acknowledgment and related to a medication
    IF is_medicine_ack AND NEW.related_entity_type = 'medication' THEN
      -- Update telegram_logs to mark as acknowledged
      NEW.user_acknowledged := true;
      NEW.sentiment := 'positive';

      -- Insert or update daily_medicine_log
      INSERT INTO daily_medicine_log (
        elderly_profile_id,
        log_date,
        medicine_taken,
        logged_at
      ) VALUES (
        NEW.elderly_profile_id,
        today_date,
        true,
        now()
      )
      ON CONFLICT (elderly_profile_id, log_date)
      DO UPDATE SET
        medicine_taken = true,
        logged_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to queue daily telegram reminders (to be called by cron job)
CREATE OR REPLACE FUNCTION queue_daily_telegram_reminders()
RETURNS void AS $$
DECLARE
  reminder_record RECORD;
  current_day text := to_char(CURRENT_DATE, 'Day');
  scheduled_datetime timestamptz;
  message_content text;
  profile_language text;
  template_json jsonb;
BEGIN
  -- Loop through all active reminders for today
  FOR reminder_record IN
    SELECT tmr.*, ep.language, ep.telegram_language_code, ep.telegram_enabled, m.name as medication_name
    FROM telegram_medicine_reminders tmr
    INNER JOIN elderly_profiles ep ON tmr.elderly_profile_id = ep.id
    INNER JOIN medications m ON tmr.medication_id = m.id
    WHERE tmr.is_active = true
    AND ep.telegram_enabled = true
    AND ep.telegram_chat_id IS NOT NULL
    AND trim(current_day) = ANY(tmr.days_of_week)
  LOOP
    -- Calculate scheduled datetime for today
    scheduled_datetime := (CURRENT_DATE + reminder_record.reminder_time)::timestamptz;

    -- Skip if already past scheduled time
    IF scheduled_datetime <= now() THEN
      scheduled_datetime := scheduled_datetime + interval '1 day';
    END IF;

    -- Check if message already queued for this reminder today
    IF NOT EXISTS (
      SELECT 1 FROM telegram_message_queue
      WHERE elderly_profile_id = reminder_record.elderly_profile_id
      AND related_entity_type = 'medication'
      AND related_entity_id = reminder_record.medication_id
      AND scheduled_for::date = CURRENT_DATE
      AND status IN ('pending', 'sent')
    ) THEN
      -- Parse template JSON and get correct language
      BEGIN
        template_json := reminder_record.reminder_template::jsonb;
        profile_language := COALESCE(reminder_record.telegram_language_code, 
                                    CASE WHEN reminder_record.language = 'Hindi' THEN 'hi' ELSE 'en' END);
        message_content := template_json->>profile_language;
      EXCEPTION WHEN OTHERS THEN
        -- Fallback to simple English message if template parsing fails
        message_content := 'Time to take your ' || reminder_record.medication_name || '. Have you taken it?';
      END;

      -- Queue the reminder message
      INSERT INTO telegram_message_queue (
        elderly_profile_id,
        message_type,
        message_content,
        scheduled_for,
        related_entity_type,
        related_entity_id,
        status,
        metadata
      ) VALUES (
        reminder_record.elderly_profile_id,
        'medicine_reminder',
        message_content,
        scheduled_datetime,
        'medication',
        reminder_record.medication_id,
        'pending',
        jsonb_build_object(
          'reminder_id', reminder_record.id,
          'medication_name', reminder_record.medication_name,
          'reminder_time', reminder_record.reminder_time
        )
      );

      -- Update last_sent_at
      UPDATE telegram_medicine_reminders
      SET last_sent_at = now()
      WHERE id = reminder_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on elderly_profiles for welcome messages
DROP TRIGGER IF EXISTS telegram_welcome_message_trigger ON elderly_profiles;
CREATE TRIGGER telegram_welcome_message_trigger
  BEFORE INSERT OR UPDATE OF telegram_chat_id ON elderly_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_telegram_welcome_message();

-- Create trigger on medications for automatic reminder creation
DROP TRIGGER IF EXISTS telegram_medicine_reminder_creation_trigger ON medications;
CREATE TRIGGER telegram_medicine_reminder_creation_trigger
  AFTER INSERT ON medications
  FOR EACH ROW
  EXECUTE FUNCTION create_telegram_medicine_reminders_from_medication();

-- Create trigger on telegram_logs for processing user responses
DROP TRIGGER IF EXISTS telegram_response_processing_trigger ON telegram_logs;
CREATE TRIGGER telegram_response_processing_trigger
  BEFORE INSERT ON telegram_logs
  FOR EACH ROW
  WHEN (NEW.message_direction = 'received')
  EXECUTE FUNCTION process_telegram_user_response();
