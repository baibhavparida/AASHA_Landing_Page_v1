import { createClient } from 'npm:@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: orphanedCalls, error: orphanedError } = await supabase
      .from('calls')
      .select('id, created_at')
      .is('elderly_profile_id', null)
      .order('created_at', { ascending: false });

    if (orphanedError) {
      throw orphanedError;
    }

    const results = {
      total_orphaned: orphanedCalls?.length || 0,
      deleted: 0,
      error_count: 0,
      errors: [] as string[],
    };

    if (orphanedCalls && orphanedCalls.length > 0) {
      for (const call of orphanedCalls) {
        await supabase.from('call_transcripts').delete().eq('call_id', call.id);
        await supabase.from('call_analysis').delete().eq('call_id', call.id);
        await supabase.from('call_costs').delete().eq('call_id', call.id);
        
        const { error: deleteError } = await supabase
          .from('calls')
          .delete()
          .eq('id', call.id);

        if (deleteError) {
          results.error_count++;
          results.errors.push(`Failed to delete call ${call.id}: ${deleteError.message}`);
        } else {
          results.deleted++;
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error cleaning up orphaned calls:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
