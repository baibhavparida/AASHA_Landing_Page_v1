import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database contents...\n');
  console.log('='.repeat(100));
  
  // Check elderly profiles
  const profilesResult = await supabase
    .from('elderly_profiles')
    .select('id, first_name, last_name, phone_number, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (profilesResult.error) {
    console.error('Error fetching profiles:', profilesResult.error);
  } else {
    console.log('\nELDERLY PROFILES (' + (profilesResult.data ? profilesResult.data.length : 0) + ' found):');
    if (profilesResult.data && profilesResult.data.length > 0) {
      profilesResult.data.forEach((profile, i) => {
        console.log('\n  Profile ' + (i + 1) + ':');
        console.log('    ID: ' + profile.id);
        console.log('    Name: ' + profile.first_name + ' ' + profile.last_name);
        console.log('    Phone: ' + profile.phone_number);
        console.log('    Created: ' + new Date(profile.created_at).toLocaleString());
      });
    } else {
      console.log('  No elderly profiles found.');
    }
  }
  
  console.log('\n' + '='.repeat(100));
  
  // Check calls table
  const callsResult = await supabase
    .from('calls')
    .select('id, elderly_profile_id, call_type, duration_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (callsResult.error) {
    console.error('\nError fetching calls:', callsResult.error);
  } else {
    console.log('\nCALLS (' + (callsResult.data ? callsResult.data.length : 0) + ' found):');
    if (callsResult.data && callsResult.data.length > 0) {
      callsResult.data.forEach((call, i) => {
        console.log('\n  Call ' + (i + 1) + ':');
        console.log('    ID: ' + call.id);
        console.log('    Profile ID: ' + call.elderly_profile_id);
        console.log('    Type: ' + call.call_type);
        console.log('    Duration: ' + call.duration_seconds + 's');
        console.log('    Created: ' + new Date(call.created_at).toLocaleString());
      });
    } else {
      console.log('  No calls found.');
    }
  }
  
  console.log('\n' + '='.repeat(100));
  
  // Check call_analysis table
  const analysisResult = await supabase
    .from('call_analysis')
    .select('id, call_id, call_summary, user_sentiment')
    .limit(5);

  if (analysisResult.error) {
    console.error('\nError fetching call analysis:', analysisResult.error);
  } else {
    console.log('\nCALL ANALYSIS (' + (analysisResult.data ? analysisResult.data.length : 0) + ' found):');
    if (analysisResult.data && analysisResult.data.length > 0) {
      analysisResult.data.forEach((analysis, i) => {
        console.log('\n  Analysis ' + (i + 1) + ':');
        console.log('    Call ID: ' + analysis.call_id);
        console.log('    Sentiment: ' + analysis.user_sentiment);
        if (analysis.call_summary) {
          console.log('    Summary: ' + analysis.call_summary.substring(0, 100) + '...');
        }
      });
    } else {
      console.log('  No call analysis found.');
    }
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('\nDatabase check complete.');
}

checkDatabase().catch(console.error);
