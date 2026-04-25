/*
  # Daily Routine Call Trigger System
  Creates get_elderly_profile_full_details and trigger_daily_routine_calls functions.
*/

-- Final version of get_elderly_profile_full_details with all calls and correct schema
DROP FUNCTION IF EXISTS get_elderly_profile_full_details(UUID);

CREATE OR REPLACE FUNCTION get_elderly_profile_full_details(p_elderly_profile_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
  medications_data jsonb;
  interests_data jsonb;
  all_calls_data jsonb;
  caregiver_data jsonb;
BEGIN
  SELECT to_jsonb(ep.*) INTO profile_data
  FROM elderly_profiles ep
  WHERE ep.id = p_elderly_profile_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'name', m.name,
      'dosage_quantity', m.dosage_quantity,
      'times_of_day', m.times_of_day
    )
  ) INTO medications_data
  FROM medications m
  WHERE m.elderly_profile_id = p_elderly_profile_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'interest', i.interest
    )
  ) INTO interests_data
  FROM interests i
  WHERE i.elderly_profile_id = p_elderly_profile_id;

  SELECT jsonb_agg(call_data ORDER BY call_created_at DESC) INTO all_calls_data
  FROM (
    SELECT
      jsonb_build_object(
        'call_id', c.id,
        'retell_call_id', c.retell_call_id,
        'call_type', c.call_type,
        'call_status', c.call_status,
        'created_at', c.created_at,
        'ended_at', c.ended_at,
        'duration_seconds', c.duration_seconds,
        'agent_id', c.agent_id,
        'call_summary', COALESCE(ca.call_summary, ''),
        'user_sentiment', ca.user_sentiment,
        'call_successful', COALESCE(ca.call_successful, false),
        'in_voicemail', COALESCE(ca.in_voicemail, false),
        'medicine_taken', ca.medicine_taken,
        'custom_analysis_data', COALESCE(ca.custom_analysis_data, '{}'::jsonb),
        'transcript_text', ct.transcript_text,
        'speaker_segments', COALESCE(ct.speaker_segments, '[]'::jsonb),
        'llm_call_summary', ct.llm_call_summary,
        'raw_webhook_data', COALESCE(c.raw_webhook_data, '{}'::jsonb)
      ) as call_data,
      c.created_at as call_created_at
    FROM calls c
    LEFT JOIN call_analysis ca ON ca.call_id = c.id
    LEFT JOIN call_transcripts ct ON ct.call_id = c.id
    WHERE c.elderly_profile_id = p_elderly_profile_id
    ORDER BY c.created_at DESC
  ) all_calls;

  SELECT jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone_number', p.phone_number,
    'country_code', p.country_code
  ) INTO caregiver_data
  FROM profiles p
  WHERE p.id = (SELECT caregiver_profile_id FROM elderly_profiles WHERE id = p_elderly_profile_id);

  RETURN jsonb_build_object(
    'profile', profile_data,
    'medications', COALESCE(medications_data, '[]'::jsonb),
    'interests', COALESCE(interests_data, '[]'::jsonb),
    'all_calls', COALESCE(all_calls_data, '[]'::jsonb),
    'caregiver', caregiver_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_elderly_profile_full_details(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_elderly_profile_full_details(UUID) TO authenticated;

-- Function to trigger daily routine calls
CREATE OR REPLACE FUNCTION trigger_daily_routine_calls(time_preference TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  profile_payload jsonb;
  webhook_url TEXT := 'https://baibhavparida2.app.n8n.cloud/webhook/Initiate_routine_call';
  profiles_processed INTEGER := 0;
  request_id BIGINT;
BEGIN
  FOR profile_record IN
    SELECT id, first_name, last_name, phone_number, country_code
    FROM elderly_profiles
    WHERE call_time_preference = time_preference
  LOOP
    BEGIN
      profile_payload := get_elderly_profile_full_details(profile_record.id);
      SELECT net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := profile_payload
      ) INTO request_id;
      profiles_processed := profiles_processed + 1;
      RAISE NOTICE 'Triggered call for profile % (%) - Request ID: %',
        profile_record.id,
        profile_record.first_name || ' ' || profile_record.last_name,
        request_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to trigger call for profile %: %', profile_record.id, SQLERRM;
    END;
  END LOOP;
  RETURN profiles_processed;
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_daily_routine_calls(TEXT) TO postgres;
