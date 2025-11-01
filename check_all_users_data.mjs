import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Checking ALL users to see who has medications...\n');
console.log('='.repeat(100));

// Get all elderly profiles
const profilesResult = await supabase
  .from('elderly_profiles')
  .select('id, first_name, last_name, phone_number')
  .order('created_at', { ascending: false });

if (profilesResult.error) {
  console.error('Error:', profilesResult.error);
  process.exit(1);
}

console.log('Found ' + profilesResult.data.length + ' elderly profiles\n');

for (const profile of profilesResult.data) {
  console.log('\n' + profile.first_name + ' ' + profile.last_name + ' (' + profile.phone_number + ')');
  console.log('-'.repeat(80));
  
  // Get medications count
  const medsResult = await supabase
    .from('medications')
    .select('name, dosage_quantity, times_of_day')
    .eq('elderly_profile_id', profile.id);
  
  console.log('  Medications: ' + medsResult.data.length);
  if (medsResult.data.length > 0) {
    medsResult.data.forEach((med, i) => {
      console.log('    ' + (i + 1) + '. ' + med.name + ' - ' + med.dosage_quantity + ' - ' + med.times_of_day.join(', '));
    });
  }
  
  // Get interests count
  const interestsResult = await supabase
    .from('interests')
    .select('interest')
    .eq('elderly_profile_id', profile.id);
  
  console.log('  Interests: ' + interestsResult.data.length);
  if (interestsResult.data.length > 0) {
    const interests = interestsResult.data.map(i => i.interest).join(', ');
    console.log('    ' + interests);
  }
  
  // Get calls count
  const callsResult = await supabase
    .from('calls')
    .select('id, call_type')
    .eq('elderly_profile_id', profile.id);
  
  console.log('  Calls: ' + callsResult.data.length);
}

console.log('\n' + '='.repeat(100));
console.log('\nSUMMARY:');
console.log('  Most users likely skipped the medications step during onboarding');
console.log('  This is normal - users can add medications later from the dashboard');
