import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEBHOOK_URL = "https://sunitaai.app.n8n.cloud/webhook/Initiate_routine_call";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { elderly_profile_id } = await req.json();

    if (!elderly_profile_id) {
      return new Response(
        JSON.stringify({ success: false, error: "elderly_profile_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full profile details from DB function
    const { data: profileData, error: dbError } = await supabase
      .rpc("get_elderly_profile_full_details", { p_elderly_profile_id: elderly_profile_id });

    if (dbError) {
      console.error("Error fetching profile data:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch profile data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to n8n webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    const responseText = await webhookResponse.text();
    console.log(`Webhook response status: ${webhookResponse.status}, body: ${responseText}`);

    // Treat any response from n8n as success (it may return non-200 but still processed)
    return new Response(
      JSON.stringify({ success: true, status: webhookResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in initiate-routine-call:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to initiate call" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
