import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSumitCalls() {
  console.log('=== Checking User 4086257375 ===\n');

  // Find profile
  const { data: profile, error: profileError } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('phone_number', '4086257375')
    .maybeSingle();

  if (profileError) {
    console.error('Error:', profileError);
    return;
  }

  if (!profile) {
    console.log('Profile not found');
    return;
  }

  console.log('Profile:', profile.first_name, profile.last_name);
  console.log('ID:', profile.id);
  console.log('Phone:', profile.country_code + profile.phone_number);

  // Get all calls with related data
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select(`
      *,
      call_analysis(*),
      call_transcripts(*)
    `)
    .eq('elderly_profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (callsError) {
    console.error('Error fetching calls:', callsError);
    return;
  }

  console.log('\nTotal calls in DB:', calls ? calls.length : 0);

  if (calls && calls.length > 0) {
    calls.forEach((call, i) => {
      const callDate = new Date(call.created_at);
      console.log('\n--- Call', i + 1, '---');
      console.log('Date:', callDate.toLocaleDateString(), callDate.toLocaleTimeString());
      console.log('Call ID:', call.id);
      console.log('Retell ID:', call.retell_call_id || 'NULL');
      console.log('Duration:', call.duration_seconds, 'seconds');
      console.log('Status:', call.call_status);
      console.log('Type:', call.call_type);
      console.log('Webhook received:', call.retell_webhook_received);
      
      // Check analysis
      console.log('\nAnalysis records:', call.call_analysis ? call.call_analysis.length : 0);
      if (call.call_analysis && call.call_analysis.length > 0) {
        call.call_analysis.forEach((analysis, j) => {
          console.log('  Analysis', j + 1 + ':');
          console.log('    Summary:', analysis.call_summary ? analysis.call_summary.substring(0, 100) + '...' : 'EMPTY');
          console.log('    Summary length:', (analysis.call_summary || '').length, 'chars');
          console.log('    Sentiment:', analysis.user_sentiment || 'NULL');
          console.log('    Successful:', analysis.call_successful);
          console.log('    Medicine taken:', analysis.medicine_taken);
        });
      }

      // Check transcripts
      console.log('\nTranscript records:', call.call_transcripts ? call.call_transcripts.length : 0);
      if (call.call_transcripts && call.call_transcripts.length > 0) {
        call.call_transcripts.forEach((transcript, j) => {
          console.log('  Transcript', j + 1 + ':');
          console.log('    Has transcript_text:', !!transcript.transcript_text);
          console.log('    Transcript length:', (transcript.transcript_text || '').length, 'chars');
          console.log('    Has llm_call_summary:', !!transcript.llm_call_summary);
          console.log('    LLM summary length:', (transcript.llm_call_summary || '').length, 'chars');
          if (transcript.llm_call_summary) {
            console.log('    LLM summary:', transcript.llm_call_summary.substring(0, 150) + '...');
          }
        });
      }
    });

    // Show what the UI should display
    console.log('\n=== UI Display Logic ===');
    calls.slice(0, 3).forEach((call, i) => {
      const analysis = call.call_analysis ? call.call_analysis[0] : null;
      const transcript = call.call_transcripts ? call.call_transcripts[0] : null;
      
      const summary = (analysis && analysis.call_summary && analysis.call_summary.trim().length > 0 ? analysis.call_summary : null) ||
                      (transcript && transcript.llm_call_summary && transcript.llm_call_summary.trim().length > 0 ? transcript.llm_call_summary : null) ||
                      'No summary available';
      
      const callDate = new Date(call.created_at);
      console.log('\nCall', i + 1, '-', callDate.toLocaleDateString());
      console.log('Display summary:', summary.substring(0, 100));
    });
  } else {
    console.log('\nNo calls found for this user');
  }
}

checkSumitCalls().catch(console.error);
