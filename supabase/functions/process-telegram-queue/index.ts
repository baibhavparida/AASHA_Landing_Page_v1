import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

    // Get pending messages that are due to be sent
    const { data: pendingMessages, error: fetchError } = await supabase
      .from("telegram_message_queue")
      .select(`
        id,
        elderly_profile_id,
        message_type,
        message_content,
        scheduled_for,
        related_entity_type,
        related_entity_id,
        retry_count,
        metadata,
        elderly_profiles (
          telegram_chat_id,
          telegram_enabled,
          first_name
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("retry_count", 3)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch pending messages: ${fetchError.message}`);
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending messages to process",
          processed: 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each message
    for (const message of pendingMessages) {
      results.processed++;

      try {
        // Skip if Telegram not enabled or no chat_id
        const profile = message.elderly_profiles as any;
        if (!profile || !profile.telegram_enabled || !profile.telegram_chat_id) {
          await supabase
            .from("telegram_message_queue")
            .update({ status: "cancelled" })
            .eq("id", message.id);
          results.skipped++;
          continue;
        }

        // Send message via n8n webhook
        const webhookUrl = "https://sunitaai.app.n8n.cloud/webhook/telegram_send_message";
        const webhookPayload = {
          chat_id: profile.telegram_chat_id,
          message: message.message_content,
          elderly_profile_id: message.elderly_profile_id,
          message_type: message.message_type,
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
          console.error(`Webhook failed for message ${message.id}:`, errorText);

          // Update status to failed and increment retry count
          await supabase
            .from("telegram_message_queue")
            .update({
              status: message.retry_count >= 2 ? "failed" : "pending",
              delivery_error: `Webhook failed: ${errorText}`,
              retry_count: message.retry_count + 1,
            })
            .eq("id", message.id);

          results.failed++;
          continue;
        }

        const webhookResult = await webhookResponse.json().catch(() => ({ success: true }));
        const telegramMessageId = webhookResult?.message_id || webhookResult?.telegram_message_id;

        // Log the sent message
        await supabase
          .from("telegram_logs")
          .insert({
            elderly_profile_id: message.elderly_profile_id,
            message_direction: "sent",
            message_type: message.message_type,
            message_text: message.message_content,
            related_entity_type: message.related_entity_type,
            related_entity_id: message.related_entity_id,
            telegram_message_id: telegramMessageId,
            ai_reply: false,
            sent_at: new Date().toISOString(),
            delivered_at: new Date().toISOString(),
            metadata: message.metadata,
          });

        // Update message queue status to sent
        await supabase
          .from("telegram_message_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", message.id);

        results.sent++;
      } catch (messageError: any) {
        console.error(`Error processing message ${message.id}:`, messageError);
        
        // Update status to failed
        await supabase
          .from("telegram_message_queue")
          .update({
            status: message.retry_count >= 2 ? "failed" : "pending",
            delivery_error: messageError.message || "Unknown error",
            retry_count: message.retry_count + 1,
          })
          .eq("id", message.id);

        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message queue processed",
        results: results,
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
    console.error("Error in process-telegram-queue:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process telegram queue",
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