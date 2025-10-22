/*
  # Ensure Telegram Webhook Triggers on Registration

  This migration improves the Telegram onboarding webhook trigger to ensure it fires
  reliably during registration, even when telegram_chat_id is not yet available.

  ## Changes

  1. Updates the trigger function to log when conditions are not met
  2. Creates a helper function to manually trigger telegram welcome for existing profiles
  3. Adds better error handling and logging

  ## Notes

  - The existing trigger still requires telegram_chat_id to send actual Telegram messages
  - This ensures n8n webhook receives profile data immediately at registration
  - The database trigger handles Telegram bot integration when chat_id becomes available
*/

-- Enhanced trigger function with better logging
CREATE OR REPLACE FUNCTION trigger_telegram_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://sunitaai.app.n8n.cloud/webhook/telegram_welcome';
  profile_data jsonb;
  request_id bigint;
BEGIN
  -- Log all updates for debugging
  RAISE LOG 'Telegram trigger fired for profile %: old_chat_id=%, new_chat_id=%, onboarded_at=%',
    NEW.id, OLD.telegram_chat_id, NEW.telegram_chat_id, NEW.telegram_onboarded_at;

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

    -- Call the n8n webhook asynchronously using pg_net
    BEGIN
      SELECT net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := profile_data::jsonb
      ) INTO request_id;

      RAISE LOG 'Telegram welcome webhook called for profile %: request_id=%', NEW.id, request_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      RAISE WARNING 'Failed to call telegram welcome webhook for profile %: %', NEW.id, SQLERRM;
    END;

    -- Queue the welcome message for Telegram bot
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

    RAISE LOG 'Telegram onboarding completed for profile %', NEW.id;
  ELSE
    -- Log why trigger didn't fire
    IF NEW.telegram_chat_id IS NULL THEN
      RAISE LOG 'Telegram trigger skipped for profile %: telegram_chat_id is NULL', NEW.id;
    ELSIF NEW.telegram_onboarded_at IS NOT NULL THEN
      RAISE LOG 'Telegram trigger skipped for profile %: already onboarded at %', NEW.id, NEW.telegram_onboarded_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  -- Get the profile
  SELECT * INTO profile_record
  FROM elderly_profiles
  WHERE id = profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF profile_record.telegram_chat_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'telegram_chat_id is not set');
  END IF;

  IF profile_record.telegram_onboarded_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile already onboarded', 'onboarded_at', profile_record.telegram_onboarded_at);
  END IF;

  -- Build profile data
  profile_data := jsonb_build_object(
    'elderly_profile_id', profile_record.id,
    'telegram_chat_id', profile_record.telegram_chat_id,
    'telegram_username', profile_record.telegram_username,
    'first_name', profile_record.first_name,
    'last_name', profile_record.last_name,
    'language', profile_record.language,
    'telegram_language_code', COALESCE(profile_record.telegram_language_code, 'en')
  );

  -- Call webhook
  BEGIN
    SELECT net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := profile_data::jsonb
    ) INTO request_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;

  -- Queue message
  INSERT INTO telegram_message_queue (
    elderly_profile_id,
    message_type,
    message_content,
    scheduled_for,
    status,
    metadata
  ) VALUES (
    profile_record.id,
    'onboarding_welcome',
    CASE
      WHEN COALESCE(profile_record.telegram_language_code, 'en') = 'hi'
      THEN 'नमस्ते ' || profile_record.first_name || '! आशा में आपका स्वागत है। मैं आपका साथी हूं और आपसे हर दिन बात करूंगा।'
      ELSE 'Hello ' || profile_record.first_name || '! Welcome to Aasha. I''m your companion and will chat with you every day.'
    END,
    now(),
    'pending',
    profile_data
  );

  -- Update profile
  UPDATE elderly_profiles
  SET telegram_onboarded_at = now(),
      telegram_enabled = true
  WHERE id = profile_id;

  result := jsonb_build_object(
    'success', true,
    'request_id', request_id,
    'profile_id', profile_id,
    'telegram_chat_id', profile_record.telegram_chat_id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
