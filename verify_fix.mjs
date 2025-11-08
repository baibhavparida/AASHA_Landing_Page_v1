import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyFix() {
  console.log('=== Verifying Call Display Fix ===\n');

  const phoneNumber = '4086257375';
  const email = phoneNumber + '@aasha-temp.com';
  const hash = phoneNumber.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const password = 'aasha_' + Math.abs(hash) + '_' + phoneNumber.slice(-4) + '_temp_pw_2025';

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('✓ Authenticated as:', authData.user.id);

  const { data: profile } = await supabase
    .from('elderly_profiles')
    .select('id')
    .eq('profile_id', authData.user.id)
    .maybeSingle();

  if (!profile) {
    console.error('No elderly profile found');
    return;
  }

  console.log('✓ Found elderly profile:', profile.id);

  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('id, created_at, duration_seconds, call_analysis(call_summary), call_transcripts(llm_call_summary)')
    .eq('elderly_profile_id', profile.id)
    .neq('call_type', 'onboarding')
    .order('created_at', { ascending: false })
    .limit(3);

  if (callsError) {
    console.error('Error fetching calls:', callsError);
    return;
  }

  console.log('✓ Fetched', calls.length, 'calls\n');

  console.log('=== Simulating Dashboard Display ===\n');

  const processedCalls = calls.map(call => ({
    ...call,
    llm_call_summary: call.call_transcripts?.[0]?.llm_call_summary || null
  }));

  processedCalls.forEach((call, i) => {
    const summary = call.call_analysis?.[0]?.call_summary || call.llm_call_summary || 'No summary available';
    const callDate = new Date(call.created_at);
    const callTitle = callDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = callDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const duration = Math.floor(call.duration_seconds / 60) + ':' + (call.duration_seconds % 60).toString().padStart(2, '0');

    console.log((i + 1) + '. ' + callTitle);
    console.log('   Time: ' + timeStr);
    console.log('   Duration: ' + duration);
    console.log('   Summary: ' + summary.substring(0, 100) + (summary.length > 100 ? '...' : ''));
    console.log('');
  });

  await supabase.auth.signOut();
  console.log('✓ Test complete - calls should now display in dashboard!');
}

verifyFix().catch(console.error);
