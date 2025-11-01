import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryCallsData() {
  console.log('Querying database for profiles with call logs...\n');
  
  const result = await supabase
    .from('calls')
    .select('*, call_analysis(*), elderly_profiles(first_name, last_name, phone_number)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (result.error) {
    console.error('Error:', result.error);
    return;
  }

  const fullCalls = result.data;

  if (!fullCalls || fullCalls.length === 0) {
    console.log('No calls found in the database.');
    return;
  }

  console.log('Found ' + fullCalls.length + ' calls in the database\n');
  console.log('='.repeat(100));

  const profileMap = new Map();
  
  fullCalls.forEach(call => {
    const profileId = call.elderly_profile_id;
    if (!profileMap.has(profileId)) {
      profileMap.set(profileId, {
        profile: call.elderly_profiles,
        profileId: profileId,
        calls: []
      });
    }
    profileMap.get(profileId).calls.push(call);
  });

  profileMap.forEach((data, profileId) => {
    const profile = data.profile;
    const firstName = profile && profile.first_name ? profile.first_name : 'Unknown';
    const lastName = profile && profile.last_name ? profile.last_name : '';
    const phone = profile && profile.phone_number ? profile.phone_number : 'N/A';
    
    console.log('\nProfile: ' + firstName + ' ' + lastName);
    console.log('Phone: ' + phone);
    console.log('Profile ID: ' + profileId);
    console.log('Total Calls: ' + data.calls.length);
    console.log('-'.repeat(100));
    
    const callsToShow = data.calls.slice(0, 5);
    callsToShow.forEach((call, index) => {
      const callNum = index + 1;
      console.log('\n  Call ' + callNum + ':');
      console.log('    Retell ID: ' + (call.retell_call_id || 'N/A'));
      console.log('    Type: ' + (call.call_type || 'N/A'));
      
      if (call.duration_seconds) {
        const mins = Math.floor(call.duration_seconds / 60);
        const secs = call.duration_seconds % 60;
        console.log('    Duration: ' + mins + 'm ' + secs + 's');
      }
      
      if (call.created_at) {
        console.log('    Created: ' + new Date(call.created_at).toLocaleString());
      }
      
      if (call.call_analysis && call.call_analysis.length > 0) {
        const analysis = call.call_analysis[0];
        if (analysis.call_summary) {
          const summary = analysis.call_summary.substring(0, 150);
          console.log('    Summary: ' + summary + '...');
        }
        if (analysis.user_sentiment) {
          console.log('    Sentiment: ' + analysis.user_sentiment);
        }
      }
    });
    
    if (data.calls.length > 5) {
      console.log('\n  ... and ' + (data.calls.length - 5) + ' more calls');
    }
    
    console.log('\n' + '='.repeat(100));
  });

  console.log('\n\nSUMMARY:');
  console.log('  Unique profiles with calls: ' + profileMap.size);
  console.log('  Total calls: ' + fullCalls.length);
}

queryCallsData().catch(console.error);
