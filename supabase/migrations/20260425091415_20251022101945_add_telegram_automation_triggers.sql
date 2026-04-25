/*
  # Telegram Automation Database Triggers
  Creates trigger functions for welcome messages, medicine reminders, and response processing.
*/

-- Welcome message trigger function (final version with logging)
CREATE OR REPLACE FUNCTION trigger_telegram_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://sunitaai.app.n8n.cloud/webhook/telegram_welcome';
  profile_data jsonb;
  request_id bigint;
BEGIN
  RAISE LOG 'Telegram trigger fired for profile %: old_chat_id=%, new_chat_id=%, onboarded_at=%',
    NEW.id, OLD.telegram_chat_id, NEW.telegram_chat_id, NEW.telegram_onboarded_at;

  IF NEW.telegram_chat_id IS NOT NULL
     AND (OLD.telegram_chat_id IS NULL OR OLD.telegram_chat_id IS DISTINCT FROM NEW.telegram_chat_id)
     AND NEW.telegram_onboarded_at IS NULL THEN

    profile_data := jsonb_build_object(
      'elderly_profile_id', NEW.id,
      'telegram_chat_id', NEW.telegram_chat_id,
      'telegram_username', NEW.telegram_username,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'language', NEW.language,
      'telegram_language_code', COALESCE(NEW.telegram_language_code, 'en')
    );

    BEGIN
      SELECT net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := profile_data::jsonb
      ) INTO request_id;
      RAISE LOG 'Telegram welcome webhook called for profile %: request_id=%', NEW.id, request_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to call telegram welcome webhook for profile %: %', NEW.id, SQLERRM;
    END;

    INSERT INTO telegram_message_queue (
      elderly_profile_id, message_type, message_content, scheduled_for, status, metadata
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

    NEW.telegram_onboarded_at := now();
    NEW.telegram_enabled := true;
    RAISE LOG 'Telegram onboarding completed for profile %', NEW.id;
  ELSE
    IF NEW.telegram_chat_id IS NULL THEN
      RAISE LOG 'Telegram trigger skipped for profile %: telegram_chat_id is NULL', NEW.id;
    ELSIF NEW.telegram_onboarded_at IS NOT NULL THEN
      RAISE LOG 'Telegram trigger skipped for profile %: already onboarded at %', NEW.id, NEW.telegram_onboarded_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Medicine reminder creation trigger
CREATE OR REPLACE FUNCTION create_telegram_medicine_reminders_from_medication()
RETURNS TRIGGER AS $$
DECLARE
  time_of_day text;
  reminder_time time;
  reminder_template_en text;
  reminder_template_hi text;
  med_name text;
BEGIN
  med_name := NEW.name;
  FOREACH time_of_day IN ARRAY NEW.times_of_day
  LOOP
    reminder_time := CASE time_of_day
      WHEN 'Morning' THEN '08:00:00'::time
      WHEN 'Afternoon' THEN '14:00:00'::time
      WHEN 'Evening' THEN '19:00:00'::time
      WHEN 'Night' THEN '21:00:00'::time
      ELSE '09:00:00'::time
    END;
    reminder_template_en := 'Time to take your ' || med_name || ' (' || NEW.dosage_quantity::text || ' tablet' ||
                           CASE WHEN NEW.dosage_quantity > 1 THEN 's' ELSE '' END || '). Have you taken it?';
    reminder_template_hi := 'अपनी ' || med_name || ' (' || NEW.dosage_quantity::text || ' गोली' ||
                           CASE WHEN NEW.dosage_quantity > 1 THEN 'यां' ELSE '' END || ') लेने का समय। क्या आपने ले ली?';
    INSERT INTO telegram_medicine_reminders (
      medication_id, elderly_profile_id, reminder_time, is_active, reminder_template
    ) VALUES (
      NEW.id, NEW.elderly_profile_id, reminder_time, true,
      jsonb_build_object('en', reminder_template_en, 'hi', reminder_template_hi)::text
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User response processing trigger
CREATE OR REPLACE FUNCTION process_telegram_user_response()
RETURNS TRIGGER AS $$
DECLARE
  response_lower text;
  is_medicine_ack boolean := false;
  today_date date := CURRENT_DATE;
BEGIN
  IF NEW.message_direction = 'received' AND NEW.message_text IS NOT NULL THEN
    response_lower := lower(NEW.message_text);
    is_medicine_ack := (
      response_lower LIKE '%yes%' OR response_lower LIKE '%taken%' OR response_lower LIKE '%took%' OR
      response_lower LIKE '%done%' OR response_lower LIKE '%हां%' OR response_lower LIKE '%ली%' OR
      response_lower LIKE '%ले लिया%' OR response_lower LIKE '%खा लिया%' OR
      response_lower = 'y' OR response_lower = 'yes' OR response_lower = 'ok'
    );
    IF is_medicine_ack AND NEW.related_entity_type = 'medication' THEN
      NEW.user_acknowledged := true;
      NEW.sentiment := 'positive';
      INSERT INTO daily_medicine_log (elderly_profile_id, log_date, medicine_taken, logged_at)
      VALUES (NEW.elderly_profile_id, today_date, true, now())
      ON CONFLICT (elderly_profile_id, log_date)
      DO UPDATE SET medicine_taken = true, logged_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Daily reminder queue function
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
  FOR reminder_record IN
    SELECT tmr.*, ep.language, ep.telegram_language_code, ep.telegram_enabled, m.name as medication_name
    FROM telegram_medicine_reminders tmr
    INNER JOIN elderly_profiles ep ON tmr.elderly_profile_id = ep.id
    INNER JOIN medications m ON tmr.medication_id = m.id
    WHERE tmr.is_active = true AND ep.telegram_enabled = true
    AND ep.telegram_chat_id IS NOT NULL AND trim(current_day) = ANY(tmr.days_of_week)
  LOOP
    scheduled_datetime := (CURRENT_DATE + reminder_record.reminder_time)::timestamptz;
    IF scheduled_datetime <= now() THEN
      scheduled_datetime := scheduled_datetime + interval '1 day';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM telegram_message_queue
      WHERE elderly_profile_id = reminder_record.elderly_profile_id
      AND related_entity_type = 'medication' AND related_entity_id = reminder_record.medication_id
      AND scheduled_for::date = CURRENT_DATE AND status IN ('pending', 'sent')
    ) THEN
      BEGIN
        template_json := reminder_record.reminder_template::jsonb;
        profile_language := COALESCE(reminder_record.telegram_language_code,
                                    CASE WHEN reminder_record.language = 'Hindi' THEN 'hi' ELSE 'en' END);
        message_content := template_json->>profile_language;
      EXCEPTION WHEN OTHERS THEN
        message_content := 'Time to take your ' || reminder_record.medication_name || '. Have you taken it?';
      END;
      INSERT INTO telegram_message_queue (
        elderly_profile_id, message_type, message_content, scheduled_for,
        related_entity_type, related_entity_id, status, metadata
      ) VALUES (
        reminder_record.elderly_profile_id, 'medicine_reminder', message_content, scheduled_datetime,
        'medication', reminder_record.medication_id, 'pending',
        jsonb_build_object('reminder_id', reminder_record.id, 'medication_name', reminder_record.medication_name, 'reminder_time', reminder_record.reminder_time)
      );
      UPDATE telegram_medicine_reminders SET last_sent_at = now() WHERE id = reminder_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS telegram_welcome_message_trigger ON elderly_profiles;
CREATE TRIGGER telegram_welcome_message_trigger
  BEFORE INSERT OR UPDATE OF telegram_chat_id ON elderly_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_telegram_welcome_message();

DROP TRIGGER IF EXISTS telegram_medicine_reminder_creation_trigger ON medications;
CREATE TRIGGER telegram_medicine_reminder_creation_trigger
  AFTER INSERT ON medications
  FOR EACH ROW EXECUTE FUNCTION create_telegram_medicine_reminders_from_medication();

DROP TRIGGER IF EXISTS telegram_response_processing_trigger ON telegram_logs;
CREATE TRIGGER telegram_response_processing_trigger
  BEFORE INSERT ON telegram_logs
  FOR EACH ROW
  WHEN (NEW.message_direction = 'received')
  EXECUTE FUNCTION process_telegram_user_response();

-- Helper function to manually trigger telegram welcome for a profile
CREATE OR REPLACE FUNCTION manually_trigger_telegram_welcome(profile_id uuid)
RETURNS jsonb AS $$
DECLARE
  profile_record RECORD;
  webhook_url text := 'https://sunitaai.app.n8n.cloud/webhook/telegram_welcome';
  profile_data jsonb;
  request_id bigint;
  result jsonb;
BEGIN
  SELECT * INTO profile_record FROM elderly_profiles WHERE id = profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  IF profile_record.telegram_chat_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'telegram_chat_id is not set');
  END IF;
  IF profile_record.telegram_onboarded_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile already onboarded', 'onboarded_at', profile_record.telegram_onboarded_at);
  END IF;
  profile_data := jsonb_build_object(
    'elderly_profile_id', profile_record.id,
    'telegram_chat_id', profile_record.telegram_chat_id,
    'telegram_username', profile_record.telegram_username,
    'first_name', profile_record.first_name,
    'last_name', profile_record.last_name,
    'language', profile_record.language,
    'telegram_language_code', COALESCE(profile_record.telegram_language_code, 'en')
  );
  BEGIN
    SELECT net.http_post(url := webhook_url, headers := '{"Content-Type": "application/json"}'::jsonb, body := profile_data::jsonb) INTO request_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
  INSERT INTO telegram_message_queue (elderly_profile_id, message_type, message_content, scheduled_for, status, metadata)
  VALUES (
    profile_record.id, 'onboarding_welcome',
    CASE WHEN COALESCE(profile_record.telegram_language_code, 'en') = 'hi'
      THEN 'नमस्ते ' || profile_record.first_name || '! आशा में आपका स्वागत है। मैं आपका साथी हूं और आपसे हर दिन बात करूंगा।'
      ELSE 'Hello ' || profile_record.first_name || '! Welcome to Aasha. I''m your companion and will chat with you every day.'
    END,
    now(), 'pending', profile_data
  );
  UPDATE elderly_profiles SET telegram_onboarded_at = now(), telegram_enabled = true WHERE id = profile_id;
  result := jsonb_build_object('success', true, 'request_id', request_id, 'profile_id', profile_id, 'telegram_chat_id', profile_record.telegram_chat_id);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
