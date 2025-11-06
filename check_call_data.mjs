import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../project/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCallData() {
  console.log('\n=== Checking Call Data for Sunita Dil (7816989750) ===\n');

  const { data: profile, error: profileError } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('phone_number', '7816989750')
    .maybeSingle();

  if (profileError) {
    console.error('Error:', profileError);
    return;
  }

  if (!profile) {
    console.log('No profile found');
    return;
  }

  console.log('Profile:', profile.first_name, profile.last_name);
  console.log('ID:', profile.id);

  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('*, call_analysis(*), call_transcripts(*)')
    .eq('elderly_profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (callsError) {
    console.error('Error:', callsError);
    return;
  }

  console.log('\nTotal calls:', calls ? calls.length : 0);

  const nov4Calls = calls ? calls.filter(call => {
    const callDate = new Date(call.created_at);
    return callDate.getMonth() === 10 && callDate.getDate() === 4;
  }) : [];

  console.log('Nov 4 calls:', nov4Calls.length);

  if (nov4Calls.length > 0) {
    nov4Calls.forEach((call, i) => {
      console.log('\n--- Call', i + 1, '---');
      console.log('ID:', call.id);
      console.log('Created:', call.created_at);
      console.log('Duration:', call.duration_seconds, 'seconds');
      console.log('Status:', call.call_status);
      console.log('Analysis:', call.call_analysis ? call.call_analysis.length : 0, 'records');
      console.log('Transcripts:', call.call_transcripts ? call.call_transcripts.length : 0, 'records');
      
      if (call.call_analysis && call.call_analysis.length > 0) {
        console.log('  Summary:', call.call_analysis[0].call_summary || 'EMPTY');
      }
      
      if (call.call_transcripts && call.call_transcripts.length > 0) {
        console.log('  LLM Summary:', call.call_transcripts[0].llm_call_summary || 'EMPTY');
        console.log('  Transcript:', call.call_transcripts[0].transcript_text ? 'YES' : 'NO');
      }
    });
  } else {
    console.log('\nNo Nov 4 calls. Recent calls:');
    if (calls) {
      calls.slice(0, 3).forEach((call, i) => {
        const d = new Date(call.created_at);
        console.log(i + 1, d.toLocaleString(), call.duration_seconds + 's');
      });
    }
  }
}

checkCallData().catch(console.error);
