# Telegram Webhook Integration Flow

## Overview

This document describes how Telegram onboarding webhooks are triggered in the Aasha elderly care system. The system now has **two pathways** for sending Telegram welcome webhooks to n8n.

---

## Flow Diagram

```
User Registration
       |
       v
onboardingService.ts creates elderly_profile
       |
       v
send-registration-webhook Edge Function is called
       |
       |-----> Webhook 1: Initiate_call (for voice calls)
       |
       |-----> Webhook 2: telegram_welcome (for Telegram onboarding)
                         |
                         v
                   n8n receives profile data
                   (even if telegram_chat_id is NULL)
```

**Later, when Telegram chat_id is added:**

```
UPDATE elderly_profiles SET telegram_chat_id = '12345'
       |
       v
Database Trigger: trigger_telegram_welcome_message()
       |
       v
Sends POST to telegram_welcome webhook via pg_net
       |
       v
Queues welcome message in telegram_message_queue
       |
       v
Updates telegram_onboarded_at and telegram_enabled
```

---

## Components

### 1. Registration Webhook (`send-registration-webhook`)

**Location:** `supabase/functions/send-registration-webhook/index.ts`

**Trigger:** Called automatically by `onboardingService.ts` after user registration

**What it does:**
- Receives full registration data from the frontend
- Builds a Telegram-specific payload with proper field mapping
- Sends POST requests to **two webhooks in parallel**:
  - `Initiate_call` - for voice call setup
  - `telegram_welcome` - for Telegram onboarding

**Telegram Payload Structure:**
```typescript
{
  elderly_profile_id: string,
  telegram_chat_id?: string,        // Optional - may be null at registration
  telegram_username?: string,       // Optional
  first_name: string,
  last_name: string,
  language: string,
  telegram_language_code: 'en' | 'hi',
  phone_number: string,
  country_code: string,
  registration_type: 'myself' | 'loved-one'
}
```

**Key Features:**
- Works even if `telegram_chat_id` is not available yet
- Properly handles "loved-one" registration by using elderly person's data (not caregiver's)
- Maps language correctly (Hindi → 'hi', otherwise → 'en')
- Non-blocking: Registration succeeds even if webhooks fail

---

### 2. Database Trigger (`trigger_telegram_welcome_message`)

**Location:** `supabase/migrations/20251022110903_ensure_telegram_webhook_on_registration.sql`

**Trigger Conditions:**
- Fires on INSERT or UPDATE of `elderly_profiles.telegram_chat_id`
- Only executes when:
  - `telegram_chat_id` is newly set (not NULL)
  - Old value was NULL or different from new value
  - `telegram_onboarded_at` is NULL (not already onboarded)

**What it does:**
1. Builds profile data JSON
2. Sends POST to `telegram_welcome` webhook using `pg_net.http_post()`
3. Queues welcome message in `telegram_message_queue` table
4. Sets `telegram_onboarded_at` to current timestamp
5. Sets `telegram_enabled` to true

**Logging:**
- Logs all trigger invocations
- Logs why trigger was skipped (if applicable)
- Logs successful webhook calls
- Logs errors without failing the transaction

---

### 3. Manual Trigger Function

**Function:** `manually_trigger_telegram_welcome(profile_id uuid)`

**Purpose:** Allows manual triggering of Telegram welcome for existing profiles

**Usage:**
```sql
SELECT manually_trigger_telegram_welcome('profile-uuid-here');
```

**Returns:**
```json
{
  "success": true,
  "request_id": 12345,
  "profile_id": "uuid",
  "telegram_chat_id": "123456789"
}
```

**Requirements:**
- Profile must exist
- `telegram_chat_id` must be set
- Must not already be onboarded (`telegram_onboarded_at` is NULL)

---

## When Does the Telegram Webhook Get Called?

### ✅ At Registration Time
- **Edge Function:** `send-registration-webhook`
- **When:** Immediately after user completes onboarding
- **Data Sent:** Full registration data including profile, medications, interests
- **telegram_chat_id:** May be NULL if not collected during registration
- **Purpose:** Notifies n8n that a new user has registered

### ✅ When Telegram Chat ID is Added
- **Database Trigger:** `trigger_telegram_welcome_message()`
- **When:** When `telegram_chat_id` is set on `elderly_profiles` table
- **Data Sent:** Profile data with Telegram credentials
- **telegram_chat_id:** Must be present
- **Purpose:** Initiates actual Telegram bot conversation

### ✅ Manual Trigger
- **Function:** `manually_trigger_telegram_welcome()`
- **When:** Called manually via SQL
- **Use Case:** Retry failed onboarding or testing

---

## Data Flow Example

### Scenario 1: Registration WITHOUT Telegram Chat ID

1. User completes onboarding → `elderly_profile` created with `telegram_chat_id = NULL`
2. `send-registration-webhook` sends data to n8n immediately
3. n8n webhook receives registration but cannot send Telegram message (no chat_id)
4. Later, when user connects via Telegram bot...
5. System updates `telegram_chat_id` on the profile
6. Database trigger fires → sends webhook with chat_id
7. n8n can now send actual Telegram welcome message

### Scenario 2: Registration WITH Telegram Chat ID

1. User completes onboarding → `elderly_profile` created with `telegram_chat_id = '12345'`
2. `send-registration-webhook` sends data to n8n with chat_id
3. Database trigger also fires (because chat_id is newly set)
4. Both webhooks sent to n8n (duplicate notification, but handled by n8n)
5. Telegram welcome message sent immediately

---

## Important Notes

### ⚠️ Webhook Deduplication
The n8n workflow should handle duplicate calls gracefully since both the edge function and database trigger may send webhooks for the same profile.

### ⚠️ Error Handling
- Edge function: Non-blocking, logs errors but doesn't fail registration
- Database trigger: Non-blocking, logs warnings but doesn't fail the transaction
- Both use `Promise.allSettled()` or TRY-CATCH to prevent cascading failures

### ⚠️ Language Mapping
- Frontend uses "English", "Hindi" as language values
- Telegram webhook expects 'en', 'hi' codes
- Mapping is done automatically in both edge function and trigger

### ⚠️ Loved-One Registration
For "loved-one" registration type:
- Caregiver's phone/profile is used for authentication
- Elderly person's details are sent in Telegram webhook
- Edge function correctly maps `lovedOne.firstName` instead of `firstName`

---

## Testing Checklist

- [ ] Register user WITHOUT telegram_chat_id → webhook called at registration
- [ ] Update existing profile with telegram_chat_id → trigger fires
- [ ] Register user WITH telegram_chat_id → both webhooks called
- [ ] Verify webhook payload structure matches n8n expectations
- [ ] Test "loved-one" registration → elderly person's data sent (not caregiver)
- [ ] Check database logs for trigger execution
- [ ] Test manual trigger function for retry scenarios

---

## Troubleshooting

### Webhook Not Called at Registration
1. Check `send-registration-webhook` deployment status
2. Verify `sendWebhook()` is called in `onboardingService.ts`
3. Check browser console for edge function errors
4. Review edge function logs in Supabase dashboard

### Database Trigger Not Firing
1. Check if `telegram_chat_id` is actually being updated
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'telegram_welcome_message_trigger';`
3. Check Postgres logs for trigger execution: Look for "Telegram trigger fired"
4. Verify `telegram_onboarded_at` is NULL before update

### Manual Function Fails
1. Verify profile exists: `SELECT * FROM elderly_profiles WHERE id = 'uuid';`
2. Check `telegram_chat_id` is not NULL
3. Check `telegram_onboarded_at` is NULL
4. Review error message in function return value

---

## Maintenance

### Adding New Fields to Telegram Payload
1. Update `RegistrationData` interface in `send-registration-webhook/index.ts`
2. Add field to `telegramPayload` object
3. Update database trigger if field should be included there too
4. Update this documentation

### Changing Webhook URLs
Webhook URLs are hardcoded in:
- `send-registration-webhook/index.ts` (lines 58-59)
- Database trigger function (migration file)

Update both locations and redeploy/migrate.

---

## Summary

**The Telegram onboarding webhook is now called via POST in two scenarios:**

1. **At registration** - via `send-registration-webhook` edge function
2. **When Telegram chat_id is added** - via database trigger

This dual approach ensures n8n is notified both when a user registers AND when they connect via Telegram, providing flexibility for different onboarding flows.
