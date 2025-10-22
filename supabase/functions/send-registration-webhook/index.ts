import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegistrationData {
  userId: string;
  profileId: string;
  elderlyProfileId: string;
  registrationType: string;
  phoneNumber: string;
  countryCode: string;
  toNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  language: string;
  maritalStatus: string;
  callTimePreference: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    time: string;
  }>;
  interests: string[];
  telegram_chat_id?: string;
  telegram_username?: string;
  lovedOne?: {
    phoneNumber: string;
    countryCode: string;
    toNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    language: string;
    maritalStatus: string;
    relationship: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const registrationData: RegistrationData = await req.json();

    const initiateCallWebhookUrl = "https://sunitaai.app.n8n.cloud/webhook/Initiate_call";
    const telegramWelcomeWebhookUrl = "https://sunitaai.app.n8n.cloud/webhook/telegram_welcome";

    // Build Telegram-specific payload with proper field mapping
    const telegramPayload = {
      elderly_profile_id: registrationData.elderlyProfileId,
      telegram_chat_id: registrationData.telegram_chat_id,
      telegram_username: registrationData.telegram_username,
      first_name: registrationData.lovedOne?.firstName || registrationData.firstName,
      last_name: registrationData.lovedOne?.lastName || registrationData.lastName,
      language: registrationData.lovedOne?.language || registrationData.language,
      telegram_language_code: (registrationData.lovedOne?.language || registrationData.language) === 'Hindi' ? 'hi' : 'en',
      phone_number: registrationData.lovedOne?.phoneNumber || registrationData.phoneNumber,
      country_code: registrationData.lovedOne?.countryCode || registrationData.countryCode,
      registration_type: registrationData.registrationType,
    };

    // Trigger both webhooks in parallel
    const [initiateCallResponse, telegramWelcomeResponse] = await Promise.allSettled([
      fetch(initiateCallWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      }),
      fetch(telegramWelcomeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telegramPayload),
      }),
    ]);

    // Process initiate call webhook response
    let initiateCallResult = null;
    let initiateCallError = null;
    if (initiateCallResponse.status === "fulfilled") {
      if (!initiateCallResponse.value.ok) {
        const errorText = await initiateCallResponse.value.text();
        console.error("Initiate call webhook failed:", errorText);
        initiateCallError = `Initiate call webhook failed with status ${initiateCallResponse.value.status}`;
      } else {
        initiateCallResult = await initiateCallResponse.value.json().catch(() => ({ success: true }));
      }
    } else {
      console.error("Initiate call webhook error:", initiateCallResponse.reason);
      initiateCallError = initiateCallResponse.reason?.message || "Initiate call webhook failed";
    }

    // Process telegram welcome webhook response
    let telegramWelcomeResult = null;
    let telegramWelcomeError = null;
    if (telegramWelcomeResponse.status === "fulfilled") {
      if (!telegramWelcomeResponse.value.ok) {
        const errorText = await telegramWelcomeResponse.value.text();
        console.error("Telegram welcome webhook failed:", errorText);
        telegramWelcomeError = `Telegram welcome webhook failed with status ${telegramWelcomeResponse.value.status}`;
      } else {
        telegramWelcomeResult = await telegramWelcomeResponse.value.json().catch(() => ({ success: true }));
      }
    } else {
      console.error("Telegram welcome webhook error:", telegramWelcomeResponse.reason);
      telegramWelcomeError = telegramWelcomeResponse.reason?.message || "Telegram welcome webhook failed";
    }

    // Return success if at least one webhook succeeded
    const success = !initiateCallError || !telegramWelcomeError;

    return new Response(
      JSON.stringify({
        success: success,
        initiateCall: {
          success: !initiateCallError,
          result: initiateCallResult,
          error: initiateCallError,
        },
        telegramWelcome: {
          success: !telegramWelcomeError,
          result: telegramWelcomeResult,
          error: telegramWelcomeError,
        },
      }),
      {
        status: success ? 200 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-webhook:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send webhooks"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});