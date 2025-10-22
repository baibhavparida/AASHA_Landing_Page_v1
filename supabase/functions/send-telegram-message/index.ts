import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messageQueueId, elderlyProfileId, messageContent, messageType, relatedEntityType, relatedEntityId } = await req.json();

    if (!elderlyProfileId || !messageContent) {
      throw new Error("Missing required fields: elderlyProfileId and messageContent");
    }

    // Get elderly profile with telegram details
    const { data: profile, error: profileError } = await supabase
      .from("elderly_profiles")
      .select("id, telegram_chat_id, telegram_username, telegram_enabled, first_name")
      .eq("id", elderlyProfileId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    if (!profile.telegram_enabled || !profile.telegram_chat_id) {
      throw new Error("Telegram not enabled for this profile or chat_id missing");
    }

    // Send message via n8n webhook
    const webhookUrl = "https://sunitaai.app.n8n.cloud/webhook/telegram_send_message";
    const webhookPayload = {
      chat_id: profile.telegram_chat_id,
      message: messageContent,
      elderly_profile_id: elderlyProfileId,
      message_type: messageType,
      first_name: profile.first_name,
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook failed:", errorText);
      
      // Update message queue status to failed
      if (messageQueueId) {
        await supabase
          .from("telegram_message_queue")
          .update({
            status: "failed",
            delivery_error: `Webhook failed: ${errorText}`,
            retry_count: supabase.rpc("increment_retry_count", { queue_id: messageQueueId }),
          })
          .eq("id", messageQueueId);
      }

      throw new Error(`Webhook failed with status ${webhookResponse.status}`);
    }

    const webhookResult = await webhookResponse.json().catch(() => ({ success: true }));
    const telegramMessageId = webhookResult?.message_id || webhookResult?.telegram_message_id;

    // Log the sent message
    const { error: logError } = await supabase
      .from("telegram_logs")
      .insert({
        elderly_profile_id: elderlyProfileId,
        message_direction: "sent",
        message_type: messageType || "user_message",
        message_text: messageContent,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        telegram_message_id: telegramMessageId,
        ai_reply: false,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log message:", logError);
    }

    // Update message queue status to sent
    if (messageQueueId) {
      await supabase
        .from("telegram_message_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", messageQueueId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message sent successfully",
        telegram_message_id: telegramMessageId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-telegram-message:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send telegram message",
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