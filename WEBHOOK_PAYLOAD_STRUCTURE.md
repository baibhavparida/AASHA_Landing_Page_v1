# Webhook Payload Structure for "Talk to Aasha"

## Endpoint
```
POST https://sunitaai.app.n8n.cloud/webhook/Initiate_routine_call
```

## Headers
```json
{
  "Content-Type": "application/json"
}
```

## Payload Structure

When a user clicks "Talk to Aasha", the following comprehensive data is sent:

```json
{
  "elderly_profile_id": "uuid",
  "first_name": "string",
  "last_name": "string",
  "call_time_preference": "morning|afternoon|evening",
  "profile_data": {
    "profile": {
      "id": "uuid",
      "profile_id": "uuid|null",
      "caregiver_profile_id": "uuid|null",
      "phone_number": "string",
      "country_code": "+1|+91",
      "first_name": "string",
      "last_name": "string",
      "date_of_birth": "date",
      "gender": "Male|Female|Other",
      "language": "English|Hindi",
      "marital_status": "Single|Married|Widowed|Divorced",
      "call_time_preference": "morning|afternoon|evening",
      "relationship_to_caregiver": "Parent|Child|Spouse|Sibling|Grandparent|Grandchild|Other Relative|Friend|Caregiver|null",
      "telegram_username": "string|null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "medications": [
      {
        "id": "uuid",
        "name": "string",
        "dosage_quantity": "number",
        "times_of_day": ["morning", "afternoon", "evening", "night"]
      }
    ],
    "interests": [
      {
        "id": "uuid",
        "interest": "reading|music|cooking|travel|photography|art-crafts|gardening|news|health|devotional|movies|sports"
      }
    ],
    "all_calls": [
      {
        "call_id": "uuid",
        "retell_call_id": "string|null",
        "call_type": "onboarding|daily_checkin",
        "call_status": "successful|voicemail|failed",
        "created_at": "timestamp",
        "started_at": "timestamp",
        "ended_at": "timestamp|null",
        "duration_seconds": "number",
        "agent_id": "string|null",
        "call_summary": "string",
        "user_sentiment": "Positive|Negative|Neutral|null",
        "call_successful": "boolean",
        "in_voicemail": "boolean",
        "medicine_taken": "boolean|null",
        "custom_analysis_data": "object",
        "transcript_text": "string|null (full conversation transcript)",
        "speaker_segments": "array (structured transcript with speaker IDs)",
        "llm_call_summary": "string|null (AI-generated detailed summary)",
        "raw_webhook_data": "object (complete original webhook payload)"
      }
    ],
    "caregiver": {
      "id": "uuid",
      "first_name": "string",
      "last_name": "string",
      "phone_number": "string",
      "country_code": "+1|+91"
    } | null
  }
}
```

## Data Details

### Root Level Fields
- **elderly_profile_id**: Unique identifier for the elderly user's profile
- **first_name**: Elderly user's first name (quick access)
- **last_name**: Elderly user's last name (quick access)
- **call_time_preference**: Preferred time for calls (quick access)
- **profile_data**: Comprehensive data object containing all user information

### Profile Data Object

#### profile
Complete elderly user profile information including:
- Personal details (name, DOB, gender, language, marital status)
- Contact information (phone number with country code)
- Preferences (call time, language)
- Relationship information (if registered by caregiver)
- Telegram username (if available)
- Timestamps for record tracking

#### medications
Array of all medications the elderly user is taking:
- Medication name
- Dosage quantity
- Times of day when medication should be taken

#### interests
Array of elderly user's interests and hobbies:
- Categories include: reading, music, cooking, travel, photography, art-crafts, gardening, news, health, devotional, movies, sports

#### all_calls
Array of ALL calls for the elderly user (no time or count limits):
- **Call identification**: call_id, retell_call_id, agent_id
- **Call metadata**: type, status, timestamps (created_at, started_at, ended_at), duration
- **Call analysis**:
  - call_summary (human-readable summary)
  - user_sentiment (Positive, Negative, Neutral)
  - call_successful (whether call completed successfully)
  - in_voicemail (whether call went to voicemail)
  - medicine_taken (medication adherence from call)
  - custom_analysis_data (any additional analysis fields)
- **Transcript data**:
  - transcript_text (complete conversation transcript)
  - speaker_segments (structured transcript with speaker identification)
  - llm_call_summary (AI-generated detailed summary from Retell)
- **Raw data**: raw_webhook_data (complete original webhook payload for reference)

**Note**: This includes the complete call history, providing full context for AI conversations

#### caregiver
If the elderly user was registered by a family member, this contains the caregiver's information:
- Caregiver's name and contact details
- Will be null if the elderly user registered themselves

## Example Payload

```json
{
  "elderly_profile_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "call_time_preference": "morning",
  "profile_data": {
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profile_id": "660e8400-e29b-41d4-a716-446655440001",
      "caregiver_profile_id": null,
      "phone_number": "1234567890",
      "country_code": "+1",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1950-05-15",
      "gender": "Male",
      "language": "English",
      "marital_status": "Married",
      "call_time_preference": "morning",
      "relationship_to_caregiver": null,
      "telegram_username": "johndoe123",
      "created_at": "2025-10-20T10:30:00Z",
      "updated_at": "2025-10-23T14:20:00Z"
    },
    "medications": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Aspirin",
        "dosage_quantity": 75,
        "times_of_day": ["morning"]
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "Metformin",
        "dosage_quantity": 500,
        "times_of_day": ["morning", "evening"]
      }
    ],
    "interests": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "interest": "reading"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "interest": "gardening"
      },
      {
        "id": "bb0e8400-e29b-41d4-a716-446655440006",
        "interest": "music"
      }
    ],
    "all_calls": [
      {
        "call_id": "cc0e8400-e29b-41d4-a716-446655440007",
        "retell_call_id": "call_12345abc",
        "call_type": "daily_checkin",
        "call_status": "successful",
        "created_at": "2025-10-23T08:00:00Z",
        "started_at": "2025-10-23T08:00:00Z",
        "ended_at": "2025-10-23T08:12:30Z",
        "duration_seconds": 750,
        "agent_id": "agent_abc123",
        "call_summary": "User reported taking medications on time. Discussed gardening plans for the weekend.",
        "user_sentiment": "Positive",
        "call_successful": true,
        "in_voicemail": false,
        "medicine_taken": true,
        "custom_analysis_data": {
          "mood": "cheerful",
          "health_status": "good"
        },
        "transcript_text": "Agent: Good morning John! How are you feeling today?\nJohn: I'm feeling great! Just finished my morning walk in the garden.\nAgent: That's wonderful! Have you taken your medications today?\nJohn: Yes, I took both my Aspirin and Metformin with breakfast.\nAgent: Excellent! Tell me more about your gardening plans...",
        "speaker_segments": [
          {"role": "agent", "text": "Good morning John! How are you feeling today?", "timestamp": 0},
          {"role": "user", "text": "I'm feeling great! Just finished my morning walk in the garden.", "timestamp": 3.2}
        ],
        "llm_call_summary": "Morning check-in call. User confirmed medication adherence and shared excitement about gardening. Mood was positive throughout the conversation. No health concerns raised.",
        "raw_webhook_data": {
          "call_id": "call_12345abc",
          "end_timestamp": 1698048750,
          "call_analysis": {
            "call_summary": "User reported taking medications on time. Discussed gardening plans for the weekend."
          }
        }
      },
      {
        "call_id": "dd0e8400-e29b-41d4-a716-446655440008",
        "retell_call_id": "call_12345def",
        "call_type": "daily_checkin",
        "call_status": "successful",
        "created_at": "2025-10-22T08:00:00Z",
        "started_at": "2025-10-22T08:00:00Z",
        "ended_at": "2025-10-22T08:10:15Z",
        "duration_seconds": 615,
        "agent_id": "agent_abc123",
        "call_summary": "Brief check-in. User confirmed taking morning medications. Mentioned plans to read a new book.",
        "user_sentiment": "Positive",
        "call_successful": true,
        "in_voicemail": false,
        "medicine_taken": true,
        "custom_analysis_data": {},
        "transcript_text": "Agent: Hello John! How's your morning going?\nJohn: Good morning! I'm doing well...",
        "speaker_segments": [
          {"role": "agent", "text": "Hello John! How's your morning going?", "timestamp": 0}
        ],
        "llm_call_summary": "Brief morning check-in. User confirmed medication adherence. Expressed interest in reading.",
        "raw_webhook_data": {}
      }
    ],
    "caregiver": null
  }
}
```

## Implementation Location

The webhook call is implemented in:
- **File**: `/src/components/dashboard/DashboardHome.tsx`
- **Function**: `handleTalkToAasha` (lines 92-135)

## Data Source

All profile data is retrieved using the Supabase RPC function:
- **Function**: `get_elderly_profile_full_details(p_elderly_profile_id UUID)`
- **Latest Version**: Defined in migration `/supabase/migrations/20251024000000_update_webhook_payload_to_include_all_calls.sql`
- **Previous Version**: `/supabase/migrations/20251011173907_fix_get_elderly_profile_details_query_structure.sql`

This function performs a comprehensive query across multiple tables:
- **elderly_profiles** - Core profile information
- **medications** - All medications with dosage and timing
- **interests** - User hobbies and interests
- **calls** - Complete call history (ALL calls, no time or count limits)
- **call_analysis** - AI-generated summaries, sentiment, medication adherence
- **call_transcripts** - Full conversation transcripts and LLM summaries
- **profiles** - Caregiver information (if applicable)

## Recent Changes (October 24, 2025)

The webhook payload has been enhanced to include:
- **All call history** (previously limited to last 10 calls from past 7 days)
- **Complete call details**:
  - Full conversation transcripts (transcript_text)
  - Structured speaker segments
  - AI-generated detailed summaries (llm_call_summary)
  - Call success/voicemail status
  - Medication adherence per call
  - Custom analysis data
  - Raw webhook data for debugging
- **Better AI context**: The complete call history enables better conversation continuity and personalization

## Benefits of Enhanced Payload

1. **Complete Context**: AI has access to entire conversation history
2. **Better Personalization**: Can reference topics from any previous conversation
3. **Medication Tracking**: Full medication adherence history across all calls
4. **Sentiment Trends**: Track user sentiment over time
5. **Debugging Support**: Raw webhook data available for troubleshooting
6. **Transcript Access**: Full conversation transcripts for detailed analysis
