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
    "recent_calls": [
      {
        "call_id": "uuid",
        "retell_call_id": "string|null",
        "call_type": "onboarding|daily_checkin",
        "call_status": "successful|voicemail|failed",
        "created_at": "timestamp",
        "ended_at": "timestamp|null",
        "duration_seconds": "number",
        "call_summary": "string|null",
        "user_sentiment": "Positive|Negative|Neutral|null",
        "transcript_summary": "string|null"
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

#### recent_calls
Array of the last 10 calls from the past 7 days:
- Call identification (call_id, retell_call_id)
- Call metadata (type, status, timestamps, duration)
- Call analysis (summary, sentiment, transcript summary)

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
    "recent_calls": [
      {
        "call_id": "cc0e8400-e29b-41d4-a716-446655440007",
        "retell_call_id": "call_12345abc",
        "call_type": "daily_checkin",
        "call_status": "successful",
        "created_at": "2025-10-23T08:00:00Z",
        "ended_at": "2025-10-23T08:12:30Z",
        "duration_seconds": 750,
        "call_summary": "User reported taking medications on time. Discussed gardening plans for the weekend.",
        "user_sentiment": "Positive",
        "transcript_summary": "Morning check-in call. User confirmed medication adherence and shared excitement about gardening."
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
- **Location**: Defined in migration `/supabase/migrations/20251011173907_fix_get_elderly_profile_details_query_structure.sql`

This function performs a comprehensive query across multiple tables:
- elderly_profiles
- medications
- interests
- calls (with call_analysis and call_transcripts)
- profiles (for caregiver information)
