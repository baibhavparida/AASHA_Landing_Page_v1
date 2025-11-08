import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAllCalls() {
  console.log('=== All Profiles Named Sumit ===\n');
  
  const { data: sumitProfiles } = await supabase
    .from('elderly_profiles')
    .select('*')
    .ilike('first_name', '%sumit%');

  if (sumitProfiles) {
    sumitProfiles.forEach(p => {
      console.log('Name:', p.first_name, p.last_name);
      console.log('Phone:', p.country_code + p.phone_number);
      console.log('ID:', p.id);
      console.log('');
    });
  }

  console.log('\n=== ALL Calls in Database ===\n');
  
  const { data: allCalls, error } = await supabase
    .from('calls')
    .select(`
      id,
      elderly_profile_id,
      created_at,
      duration_seconds,
      call_status,
      call_type,
      retell_webhook_received,
      call_analysis(call_summary, user_sentiment),
      call_transcripts(llm_call_summary)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total calls:', allCalls ? allCalls.length : 0);

  if (allCalls && allCalls.length > 0) {
    allCalls.forEach((call, i) => {
      const d = new Date(call.created_at);
      console.log('\n' + (i + 1) + '. ' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString());
      console.log('   Profile ID:', call.elderly_profile_id);
      console.log('   Duration:', call.duration_seconds + 's');
      console.log('   Status:', call.call_status);
      console.log('   Has analysis:', call.call_analysis && call.call_analysis.length > 0);
      console.log('   Has transcript:', call.call_transcripts && call.call_transcripts.length > 0);
      if (call.call_analysis && call.call_analysis[0] && call.call_analysis[0].call_summary) {
        console.log('   Summary:', call.call_analysis[0].call_summary.substring(0, 80));
      }
    });
  } else {
    console.log('\nNo calls exist in the entire database');
  }

  // Check with service role key if available
  console.log('\n=== Checking table existence ===');
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'calls');
  
  console.log('Calls table exists:', tables && tables.length > 0);
}

checkAllCalls().catch(console.error);
