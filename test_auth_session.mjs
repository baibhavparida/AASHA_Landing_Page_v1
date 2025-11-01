import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthSession() {
  console.log('Testing authentication session and data access...\n');
  console.log('='.repeat(100));
  
  // Try to sign in as one of the existing users
  const phoneNumber = '7816989750';
  const email = phoneNumber + '@aasha-temp.com';
  
  // Generate the same password used in registration
  const hash = phoneNumber.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const password = 'aasha_' + Math.abs(hash) + '_' + phoneNumber.slice(-4) + '_temp_pw_2025';
  
  console.log('Attempting to sign in...');
  console.log('Email:', email);
  
  const signInResult = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (signInResult.error) {
    console.log('Sign in ERROR:', signInResult.error.message);
    console.log('\nThis means users cannot log in properly!');
    return;
  }
  
  if (!signInResult.data.session) {
    console.log('Sign in succeeded but NO SESSION created!');
    return;
  }
  
  console.log('Sign in SUCCESS!');
  console.log('User ID:', signInResult.data.user.id);
  console.log('Session exists:', !!signInResult.data.session);
  console.log('\n' + '='.repeat(100));
  
  // Now try to fetch data with the authenticated session
  console.log('\nTesting data access with authenticated session...\n');
  
  const profileId = signInResult.data.user.id;
  
  // Get elderly profile
  const elderlyProfileResult = await supabase
    .from('elderly_profiles')
    .select('id, first_name, last_name')
    .eq('profile_id', profileId)
    .maybeSingle();
  
  console.log('ELDERLY PROFILE:');
  if (elderlyProfileResult.error) {
    console.log('  Error:', elderlyProfileResult.error.message);
  } else if (elderlyProfileResult.data) {
    console.log('  SUCCESS! Found:', elderlyProfileResult.data.first_name, elderlyProfileResult.data.last_name);
    console.log('  ID:', elderlyProfileResult.data.id);
    
    // Try to get medications
    const medsResult = await supabase
      .from('medications')
      .select('*')
      .eq('elderly_profile_id', elderlyProfileResult.data.id);
    
    console.log('\nMEDICATIONS:');
    if (medsResult.error) {
      console.log('  Error:', medsResult.error.message);
    } else {
      console.log('  Count:', medsResult.data.length);
      if (medsResult.data.length > 0) {
        medsResult.data.forEach((med, i) => {
          console.log('  ' + (i + 1) + '. ' + med.name);
        });
      }
    }
    
    // Try to get interests
    const interestsResult = await supabase
      .from('interests')
      .select('*')
      .eq('elderly_profile_id', elderlyProfileResult.data.id);
    
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
  } else {
    console.log('  No elderly profile found for this user');
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('\nCONCLUSION:');
  console.log('If you see data above, the auth + RLS is working correctly.');
  console.log('If you see errors or no data, there is a problem with RLS policies or data was not saved.');
  
  // Sign out
  await supabase.auth.signOut();
}

testAuthSession().catch(console.error);
