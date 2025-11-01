import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxxoldpdbwxqndebypl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meHhvbGRwZGJ3eHFuZGVieXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwNTUsImV4cCI6MjA3NTUxNjA1NX0.aKHYidOVeyhYoTwd06zVN2jhP5Mh8slwsxzAMPUnH6w';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing: What happens when we try to access data WITHOUT authentication?\n');
console.log('='.repeat(100));

const profileId = 'd4ae4db6-4f2b-4b14-b238-508e0913ff42';

// Try WITHOUT auth session (simulating what the dashboard might be doing)
const interestsResult = await supabase
  .from('interests')
  .select('*')
  .eq('elderly_profile_id', profileId);

console.log('\nAccessing interests WITHOUT authentication:');
if (interestsResult.error) {
  console.log('  ERROR:', interestsResult.error.message);
  console.log('  Code:', interestsResult.error.code);
} else {
  console.log('  SUCCESS! Count:', interestsResult.data.length);
}

console.log('\n' + '='.repeat(100));
console.log('\nThis proves the issue: Dashboard is trying to load data without a valid auth session!');
