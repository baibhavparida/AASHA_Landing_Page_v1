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

    const payload = await req.json();
    
    // Extract Telegram webhook data
    const chatId = payload.chat_id || payload.message?.chat?.id;
    const messageText = payload.text || payload.message?.text;
    const telegramMessageId = payload.message_id || payload.message?.message_id?.toString();
    const username = payload.username || payload.message?.from?.username;

    if (!chatId || !messageText) {
      throw new Error("Missing required Telegram data: chat_id or message text");
    }

    // Find elderly profile by telegram_chat_id
    const { data: profile, error: profileError } = await supabase
      .from("elderly_profiles")
      .select("id, first_name, telegram_enabled, language")
      .eq("telegram_chat_id", chatId.toString())
      .eq("telegram_enabled", true)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile not found for chat_id:", chatId);
      throw new Error("Profile not found or Telegram not enabled");
    }

    // Check if this is a response to a medicine reminder
    const messageLower = messageText.toLowerCase();
    const isMedicineResponse = (
      messageLower.includes("yes") ||
      messageLower.includes("taken") ||
      messageLower.includes("took") ||
      messageLower.includes("done") ||
      messageLower.includes("हां") ||
      messageLower.includes("ली") ||
      messageLower.includes("ले लिया") ||
      messageLower.includes("खा लिया") ||
      messageLower === "y" ||
      messageLower === "ok"
    );

    // Find the most recent medicine reminder sent to this user
    let relatedEntityType = null;
    let relatedEntityId = null;

    if (isMedicineResponse) {
      const { data: recentReminder } = await supabase
        .from("telegram_logs")
        .select("related_entity_id")
        .eq("elderly_profile_id", profile.id)
        .eq("message_direction", "sent")
        .eq("message_type", "medicine_reminder")
        .eq("related_entity_type", "medication")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentReminder?.related_entity_id) {
        relatedEntityType = "medication";
        relatedEntityId = recentReminder.related_entity_id;
      }
    }

    // Determine sentiment
    let sentiment = "neutral";
    if (messageLower.includes("good") || messageLower.includes("great") || messageLower.includes("अच्छा") || messageLower.includes("बढ़िया")) {
      sentiment = "positive";
    } else if (messageLower.includes("bad") || messageLower.includes("not") || messageLower.includes("बुरा") || messageLower.includes("नहीं")) {
      sentiment = "negative";
    } else if (messageLower.includes("?") || messageLower.includes("help") || messageLower.includes("मदद")) {
      sentiment = "confused";
    }

    // Log the received message (trigger will process it)
    const { error: logError } = await supabase
      .from("telegram_logs")
      .insert({
        elderly_profile_id: profile.id,
        message_direction: "received",
        message_type: "user_message",
        message_text: messageText,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        telegram_message_id: telegramMessageId,
        ai_reply: false,
        user_acknowledged: isMedicineResponse,
        sentiment: sentiment,
        sent_at: new Date().toISOString(),
        metadata: {
          username: username,
          raw_payload: payload,
        },
      });

    if (logError) {
      console.error("Failed to log received message:", logError);
      throw logError;
    }

    // Generate AI response if needed
    let aiResponse = null;
    if (isMedicineResponse) {
      aiResponse = profile.language === "Hindi" 
        ? `बहुत बढ़िया ${profile.first_name}! आपकी दवा लेने के लिए धन्यवाद। 😊`
        : `Great job ${profile.first_name}! Thank you for taking your medicine. 😊`;
    } else if (sentiment === "confused") {
      aiResponse = profile.language === "Hindi"
        ? `मैं यहां मदद के लिए हूं ${profile.first_name}। आप मुझसे कुछ भी पूछ सकते हैं।`
        : `I'm here to help ${profile.first_name}. Feel free to ask me anything.`;
    }

    // Send AI response if generated
    if (aiResponse) {
      const { error: aiLogError } = await supabase
        .from("telegram_logs")
        .insert({
          elderly_profile_id: profile.id,
          message_direction: "sent",
          message_type: "ai_response",
          message_text: aiResponse,
          ai_reply: true,
          sent_at: new Date().toISOString(),
        });

      if (!aiLogError) {
        // Send the AI response via webhook
        const webhookUrl = "https://sunitaai.app.n8n.cloud/webhook/telegram_send_message";
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message: aiResponse,
            elderly_profile_id: profile.id,
            message_type: "ai_response",
          }),
        }).catch(err => console.error("Failed to send AI response:", err));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message received and processed",
        ai_response: aiResponse,
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
    console.error("Error in receive-telegram-message:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process telegram message",
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