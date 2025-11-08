import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthSession() {
  console.log('=== Testing Authentication Flow ===\n');

  const phoneNumber = '4086257375';
  const email = `${phoneNumber}@aasha-temp.com`;
  
  // Generate password (same logic as in LoginModal)
  const hash = phoneNumber.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const password = `aasha_${Math.abs(hash)}_${phoneNumber.slice(-4)}_temp_pw_2025`;

  console.log('Signing in with email:', email);

  // Sign in
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('✓ Sign in successful');
  console.log('User ID:', authData.user.id);
  console.log('Session exists:', !!authData.session);

  // Now test fetching calls with the authenticated session
  console.log('\n=== Testing Call Fetch with Authenticated Session ===\n');

  // First get the elderly profile
  const { data: profile } = await supabase
    .from('elderly_profiles')
    .select('id')
    .eq('profile_id', authData.user.id)
    .maybeSingle();

  if (!profile) {
    console.error('No elderly profile found');
    return;
  }

  console.log('Elderly Profile ID:', profile.id);

  // Fetch calls (this should now work with RLS)
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select(`
      id,
      created_at,
      duration_seconds,
      call_status,
      call_analysis(call_summary),
      call_transcripts(llm_call_summary)
    `)
    .eq('elderly_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (callsError) {
    console.error('Error fetching calls:', callsError);
    return;
  }

  console.log('\n✓ Calls fetched successfully!');
  console.log('Number of calls:', calls ? calls.length : 0);

  if (calls && calls.length > 0) {
    console.log('\nCall Details:');
    calls.forEach((call, i) => {
      const d = new Date(call.created_at);
      console.log(`\n${i + 1}. ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`);
      console.log(`   Duration: ${call.duration_seconds}s`);
      console.log(`   Status: ${call.call_status}`);
      if (call.call_analysis && call.call_analysis.length > 0) {
        console.log(`   Summary: ${call.call_analysis[0].call_summary ? call.call_analysis[0].call_summary.substring(0, 80) + '...' : 'N/A'}`);
      }
      if (call.call_transcripts && call.call_transcripts.length > 0) {
        console.log(`   LLM Summary: ${call.call_transcripts[0].llm_call_summary ? call.call_transcripts[0].llm_call_summary.substring(0, 80) + '...' : 'N/A'}`);
      }
    });
  } else {
    console.log('\nNo calls found (check RLS policies)');
  }

  // Clean up - sign out
  await supabase.auth.signOut();
  console.log('\n✓ Signed out successfully');
}

testAuthSession().catch(console.error);
