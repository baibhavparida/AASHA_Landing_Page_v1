/*
  # Create Function to Trigger Call for Single Elderly Profile
*/

CREATE OR REPLACE FUNCTION trigger_single_profile_call(p_elderly_profile_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_payload jsonb;
  webhook_url TEXT := 'https://baibhavparida2.app.n8n.cloud/webhook/Initiate_routine_call';
  request_id BIGINT;
  profile_name TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO profile_name
  FROM elderly_profiles
  WHERE id = p_elderly_profile_id;

  IF profile_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found', 'profile_id', p_elderly_profile_id);
  END IF;

  profile_payload := get_elderly_profile_full_details(p_elderly_profile_id);

  SELECT net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := profile_payload
  ) INTO request_id;

  RAISE NOTICE 'Triggered call for profile % (%) - Request ID: %', p_elderly_profile_id, profile_name, request_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_elderly_profile_id,
    'profile_name', profile_name,
    'request_id', request_id,
    'webhook_url', webhook_url,
    'timestamp', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'profile_id', p_elderly_profile_id, 'error', SQLERRM, 'timestamp', NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_single_profile_call(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION trigger_single_profile_call(UUID) TO authenticated;
