import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type CallInsert = Database['public']['Tables']['calls']['Insert'];
type CallAnalysisInsert = Database['public']['Tables']['call_analysis']['Insert'];
type CallTranscriptInsert = Database['public']['Tables']['call_transcripts']['Insert'];
type CallCostInsert = Database['public']['Tables']['call_costs']['Insert'];

export interface RetellWebhookData {
  call_id: string;
  call_type: 'onboarding' | 'daily_checkin';
  call_status: 'successful' | 'voicemail' | 'failed';
  start_timestamp: number;
  end_timestamp: number;
  agent_id?: string;
  transcript?: string;
  transcript_with_tool_calls?: any[];
  recording_url?: string;
  public_log_url?: string;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: 'Positive' | 'Negative' | 'Neutral';
    call_successful?: boolean;
    in_voicemail?: boolean;
    custom_analysis_data?: Record<string, any>;
  };
  llm_websocket_network_rtt_ms?: number;
  llm_latency_ms?: number;
  disconnection_reason?: string;
  call_cost?: {
    combined_cost?: number;
    llm_tokens_used?: number;
    llm_average_tokens?: number;
    llm_num_requests?: number;
    llm_token_values?: any[];
  };
  [key: string]: any;
}

export async function processRetellWebhook(
  elderlyProfileId: string,
  webhookData: RetellWebhookData
): Promise<{ callId: string; success: boolean; error?: string }> {
  try {
    const existingCallByRetellId = await supabase
      .from('calls')
      .select('id')
      .eq('retell_call_id', webhookData.call_id)
      .maybeSingle();

    if (existingCallByRetellId.data) {
      return {
        callId: existingCallByRetellId.data.id,
        success: true,
        error: 'Call already processed',
      };
    }

    const endDate = webhookData.end_timestamp
      ? new Date(webhookData.end_timestamp * 1000).toISOString()
      : null;
    const durationSeconds = webhookData.end_timestamp && webhookData.start_timestamp
      ? webhookData.end_timestamp - webhookData.start_timestamp
      : 0;

    const existingPrePopulatedCall = await supabase
      .from('calls')
      .select('id')
      .eq('elderly_profile_id', elderlyProfileId)
      .is('retell_call_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let call;
    let callError;

    if (existingPrePopulatedCall.data) {
      const updateResult = await supabase
        .from('calls')
        .update({
          retell_call_id: webhookData.call_id,
          call_type: webhookData.call_type,
          call_status: webhookData.call_status,
          ended_at: endDate,
          duration_seconds: durationSeconds,
          agent_id: webhookData.agent_id || null,
          raw_webhook_data: webhookData,
          retell_webhook_received: true,
        })
        .eq('id', existingPrePopulatedCall.data.id)
        .select()
        .single();

      call = updateResult.data;
      callError = updateResult.error;

      if (!callError) {
        console.log('Updated pre-populated call record with Retell data');
      }
    } else {
      const callData: CallInsert = {
        retell_call_id: webhookData.call_id,
        elderly_profile_id: elderlyProfileId,
        call_type: webhookData.call_type,
        call_status: webhookData.call_status,
        ended_at: endDate,
        duration_seconds: durationSeconds,
        agent_id: webhookData.agent_id || null,
        raw_webhook_data: webhookData,
        retell_webhook_received: true,
      };

      const insertResult = await supabase
        .from('calls')
        .insert(callData)
        .select()
        .single();

      call = insertResult.data;
      callError = insertResult.error;

      if (!callError) {
        console.log('Created new call record (no pre-populated record found)');
      }
    }

    if (callError) {
      console.error('Error saving call:', callError);
      throw callError;
    }

    if (webhookData.call_analysis) {
      const analysisData: CallAnalysisInsert = {
        call_id: call.id,
        call_summary: webhookData.call_analysis.call_summary || '',
        user_sentiment: webhookData.call_analysis.user_sentiment || null,
        call_successful: webhookData.call_analysis.call_successful || false,
        in_voicemail: webhookData.call_analysis.in_voicemail || false,
        custom_analysis_data: webhookData.call_analysis.custom_analysis_data || {},
      };

      const { error: analysisError } = await supabase
        .from('call_analysis')
        .insert(analysisData);

      if (analysisError) {
        console.error('Error inserting call analysis:', analysisError);
      }

      if (webhookData.call_analysis.custom_analysis_data?.medicine_taken !== undefined) {
        await trackMedicineFromCall(
          elderlyProfileId,
          call.id,
          webhookData.call_analysis.custom_analysis_data.medicine_taken
        );
      }
    }

    if (webhookData.transcript) {
      const transcriptData: CallTranscriptInsert = {
        call_id: call.id,
        transcript_text: webhookData.transcript,
        speaker_segments: webhookData.transcript_with_tool_calls || [],
      };

      const { error: transcriptError } = await supabase
        .from('call_transcripts')
        .insert(transcriptData);

      if (transcriptError) {
        console.error('Error inserting call transcript:', transcriptError);
      }
    }

    if (webhookData.call_cost) {
      const costData: CallCostInsert = {
        call_id: call.id,
        combined_cost: webhookData.call_cost.combined_cost || 0,
        llm_tokens_used: webhookData.call_cost.llm_tokens_used || 0,
        llm_average_tokens: webhookData.call_cost.llm_average_tokens || 0,
        llm_num_requests: webhookData.call_cost.llm_num_requests || 0,
        llm_token_values: webhookData.call_cost.llm_token_values || [],
      };

      const { error: costError } = await supabase
        .from('call_costs')
        .insert(costData);

      if (costError) {
        console.error('Error inserting call costs:', costError);
      }
    }

    return {
      callId: call.id,
      success: true,
    };
  } catch (error) {
    console.error('Error processing Retell webhook:', error);
    return {
      callId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function trackMedicineFromCall(
  elderlyProfileId: string,
  callId: string,
  medicineTaken: boolean
) {
  const logDate = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('daily_medicine_log')
    .upsert(
      {
        elderly_profile_id: elderlyProfileId,
        log_date: logDate,
        medicine_taken: medicineTaken,
        call_id: callId,
      },
      {
        onConflict: 'elderly_profile_id,log_date',
      }
    );

  if (error) {
    console.error('Error tracking medicine from call:', error);
  }
}

export async function getCallAnalytics(elderlyProfileId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: calls, error } = await supabase
    .from('calls')
    .select(`
      *,
      call_analysis(*),
      call_costs(*)
    `)
    .eq('elderly_profile_id', elderlyProfileId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching call analytics:', error);
    throw error;
  }

  const totalCalls = calls?.length || 0;
  const successfulCalls = calls?.filter((c) => c.call_status === 'successful').length || 0;
  const voicemailCalls = calls?.filter((c) => c.call_status === 'voicemail').length || 0;
  const failedCalls = calls?.filter((c) => c.call_status === 'failed').length || 0;

  const totalDuration = calls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0;
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const totalCost = calls?.reduce((sum, c) => {
    const cost = c.call_costs?.[0]?.combined_cost || 0;
    return sum + Number(cost);
  }, 0) || 0;

  const sentimentCounts = {
    Positive: 0,
    Negative: 0,
    Neutral: 0,
  };

  calls?.forEach((call) => {
    const sentiment = call.call_analysis?.[0]?.user_sentiment;
    if (sentiment && sentiment in sentimentCounts) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
    }
  });

  return {
    totalCalls,
    successfulCalls,
    voicemailCalls,
    failedCalls,
    totalDuration,
    avgDuration,
    totalCost: totalCost.toFixed(2),
    sentimentCounts,
    calls: calls || [],
  };
}

export async function getMedicineAdherence(elderlyProfileId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('daily_medicine_log')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .gte('log_date', startDate.toISOString().split('T')[0])
    .order('log_date', { ascending: false });

  if (error) {
    console.error('Error fetching medicine adherence:', error);
    throw error;
  }

  const totalDays = data?.length || 0;
  const takenDays = data?.filter((log) => log.medicine_taken).length || 0;
  const adherenceRate = totalDays > 0 ? Math.round((takenDays / totalDays) * 100) : 0;

  return {
    totalDays,
    takenDays,
    missedDays: totalDays - takenDays,
    adherenceRate,
    logs: data || [],
  };
}
