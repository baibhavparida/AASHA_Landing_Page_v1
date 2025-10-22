/*
  # Fix Telegram Welcome Trigger to Call Webhook Directly

  This migration updates the `trigger_telegram_welcome_message()` function to actually
  call the n8n webhook with profile data when a telegram_chat_id is set.

  ## Changes
  
  1. The function now calls the telegram_welcome webhook via http extension
  2. Still queues the message for the queue processor to send via Telegram
  3. Handles both paths: webhook notification to n8n AND message queue for Telegram bot

  ## Notes
  
  - Requires pg_net extension to be enabled (already done in previous migration)
  - Webhook call is async and doesn't block the trigger
  - Errors in webhook call don't fail the trigger
*/

-- Update function to actually call the webhook
CREATE OR REPLACE FUNCTION trigger_telegram_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://sunitaai.app.n8n.cloud/webhook/telegram_welcome';
  profile_data jsonb;
  request_id bigint;
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;