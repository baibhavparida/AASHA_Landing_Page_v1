import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileData() {
  console.log('Testing profile data access...\n');
  
  // Get one profile
  const profileId = 'd4ae4db6-4f2b-4b14-b238-508e0913ff42';
  
  console.log('Testing for Profile ID:', profileId);
  console.log('='.repeat(100));
  
  // Test medications
  const medsResult = await supabase
    .from('medications')
    .select('*')
    .eq('elderly_profile_id', profileId);
  
  console.log('\nMEDICATIONS:');
  if (medsResult.error) {
    console.log('  Error:', medsResult.error.message);
  } else {
    console.log('  Count:', medsResult.data.length);
    if (medsResult.data.length > 0) {
      medsResult.data.forEach((med, i) => {
        console.log('  ' + (i + 1) + '. ' + med.name + ' - ' + med.dosage_quantity);
      });
    }
  }
  
  // Test interests
  const interestsResult = await supabase
    .from('interests')
    .select('*')
    .eq('elderly_profile_id', profileId);
  
  console.log('\nINTERESTS:');
  if (interestsResult.error) {
    console.log('  Error:', interestsResult.error.message);
  } else {
    console.log('  Count:', interestsResult.data.length);
    if (interestsResult.data.length > 0) {
      interestsResult.data.forEach((int, i) => {
        console.log('  ' + (i + 1) + '. ' + int.interest);
      });
    }
  }
  
  // Test special events
  const eventsResult = await supabase
    .from('special_events')
    .select('*')
    .eq('elderly_profile_id', profileId);
  
  console.log('\nSPECIAL EVENTS:');
  if (eventsResult.error) {
    console.log('  Error:', eventsResult.error.message);
  } else {
    console.log('  Count:', eventsResult.data.length);
    if (eventsResult.data.length > 0) {
      eventsResult.data.forEach((evt, i) => {
        console.log('  ' + (i + 1) + '. ' + evt.event_name + ' - ' + new Date(evt.event_date).toLocaleDateString());
      });
    }
  }
  
  // Test calls
  const callsResult = await supabase
    .from('calls')
    .select('*')
    .eq('elderly_profile_id', profileId);
  
  console.log('\nCALLS:');
  if (callsResult.error) {
    console.log('  Error:', callsResult.error.message);
  } else {
    console.log('  Count:', callsResult.data.length);
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('\nSUMMARY: The issue is likely that the dashboard is trying to load data');
  console.log('but the data was saved during onboarding. Without authentication context,');
  console.log('RLS policies are blocking access to the data.');
}

testProfileData().catch(console.error);
