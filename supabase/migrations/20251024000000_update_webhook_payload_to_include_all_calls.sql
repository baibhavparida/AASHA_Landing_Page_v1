/*
  # Update Webhook Payload to Include All Call Details

  ## Overview
  This migration enhances the `get_elderly_profile_full_details` function to send
  comprehensive call history data in the webhook payload for routine calls.

  ## Changes Made

  ### Enhanced Call Data Structure
  The function now includes ALL calls (not just last 7 days or 10 calls limit) with:

  **From calls table:**
  - call_id, retell_call_id, call_type, call_status
  - created_at, started_at, ended_at, duration_seconds
  - agent_id, raw_webhook_data

  **From call_analysis table:**
  - call_summary, user_sentiment
  - call_successful, in_voicemail, medicine_taken
  - custom_analysis_data (all additional fields)

  **From call_transcripts table:**
  - transcript_text (full conversation transcript)
  - speaker_segments (structured transcript with speaker identification)
  - llm_call_summary (AI-generated detailed summary)

  ## Benefits
  - n8n workflow receives complete call history for better context
  - AI agent can reference all previous conversations
  - Better continuity and personalization in conversations
  - Full transcript access enables deeper analysis
  - Medication adherence tracking across entire history
  - Sentiment trends visible over time

  ## Backward Compatibility
  - Function signature remains the same
  - Existing fields are maintained
  - Only adds more data to the calls array
  - Consumers can ignore additional fields if not needed

  ## Performance Notes
  - Indexed queries ensure fast retrieval
  - Proper NULL handling with COALESCE
  - Efficient joins across call-related tables
  - For elderly profiles with hundreds of calls, payload size may be large

  ## Data Structure
  Each call now includes comprehensive information:
  ```json
  {
    "call_id": "uuid",
    "retell_call_id": "string",
    "call_type": "onboarding|daily_checkin",
    "call_status": "successful|voicemail|failed",
    "created_at": "timestamp",
    "started_at": "timestamp",
    "ended_at": "timestamp",
    "duration_seconds": number,
    "agent_id": "string",
    "call_summary": "string",
    "user_sentiment": "Positive|Negative|Neutral",
    "call_successful": boolean,
    "in_voicemail": boolean,
    "medicine_taken": boolean,
    "custom_analysis_data": {},
    "transcript_text": "string (full transcript)",
    "speaker_segments": [],
    "llm_call_summary": "string (detailed AI summary)",
    "raw_webhook_data": {}
  }
  ```
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_elderly_profile_full_details(UUID);

-- Create enhanced function with complete call history
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
  -- Get basic elderly profile information
  SELECT to_jsonb(ep.*) INTO profile_data
  FROM elderly_profiles ep
  WHERE ep.id = p_elderly_profile_id;

  -- Get medications with updated schema
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

  -- Get interests
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'interest', i.interest
    )
  ) INTO interests_data
  FROM interests i
  WHERE i.elderly_profile_id = p_elderly_profile_id;

  -- Get ALL call details with comprehensive data (no time or count limits)
  SELECT jsonb_agg(call_data ORDER BY call_created_at DESC) INTO all_calls_data
  FROM (
    SELECT
      jsonb_build_object(
        -- Basic call information from calls table
        'call_id', c.id,
        'retell_call_id', c.retell_call_id,
        'call_type', c.call_type,
        'call_status', c.call_status,
        'created_at', c.created_at,
        'started_at', c.started_at,
        'ended_at', c.ended_at,
        'duration_seconds', c.duration_seconds,
        'agent_id', c.agent_id,

        -- Call analysis data
        'call_summary', COALESCE(ca.call_summary, ''),
        'user_sentiment', ca.user_sentiment,
        'call_successful', COALESCE(ca.call_successful, false),
        'in_voicemail', COALESCE(ca.in_voicemail, false),
        'medicine_taken', ca.medicine_taken,
        'custom_analysis_data', COALESCE(ca.custom_analysis_data, '{}'::jsonb),

        -- Transcript data (full transcript and LLM summary)
        'transcript_text', ct.transcript_text,
        'speaker_segments', COALESCE(ct.speaker_segments, '[]'::jsonb),
        'llm_call_summary', ct.llm_call_summary,

        -- Raw webhook data for reference and debugging
        'raw_webhook_data', COALESCE(c.raw_webhook_data, '{}'::jsonb)
      ) as call_data,
      c.created_at as call_created_at
    FROM calls c
    LEFT JOIN call_analysis ca ON ca.call_id = c.id
    LEFT JOIN call_transcripts ct ON ct.call_id = c.id
    WHERE c.elderly_profile_id = p_elderly_profile_id
    ORDER BY c.created_at DESC
  ) all_calls;

  -- Get caregiver information if exists
  SELECT jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone_number', p.phone_number,
    'country_code', p.country_code
  ) INTO caregiver_data
  FROM profiles p
  WHERE p.id = (SELECT caregiver_profile_id FROM elderly_profiles WHERE id = p_elderly_profile_id);

  -- Combine all data
  RETURN jsonb_build_object(
    'profile', profile_data,
    'medications', COALESCE(medications_data, '[]'::jsonb),
    'interests', COALESCE(interests_data, '[]'::jsonb),
    'all_calls', COALESCE(all_calls_data, '[]'::jsonb),
    'caregiver', caregiver_data
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_elderly_profile_full_details(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_elderly_profile_full_details(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_elderly_profile_full_details(UUID) IS
'Returns comprehensive elderly profile data including ALL call history with complete details (transcripts, analysis, metadata) for webhook payloads. Used by routine call triggers to provide full context to n8n workflows.';
