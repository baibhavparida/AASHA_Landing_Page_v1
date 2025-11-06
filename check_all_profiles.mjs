import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAllProfiles() {
  console.log('=== All Elderly Profiles ===');

  const { data: profiles, error } = await supabase
    .from('elderly_profiles')
    .select('id, first_name, last_name, phone_number, country_code')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  profiles.forEach((p, i) => {
    console.log(i + 1, p.first_name, p.last_name);
    console.log('  Phone:', p.country_code + p.phone_number);
  });

  console.log('\n=== Sunita Profiles ===');
  const { data: sunitaProfiles } = await supabase
    .from('elderly_profiles')
    .select('*')
    .ilike('first_name', '%sunita%');

  if (sunitaProfiles && sunitaProfiles.length > 0) {
    sunitaProfiles.forEach(p => {
      console.log('Found:', p.first_name, p.last_name);
      console.log('Phone:', p.country_code + p.phone_number);
      console.log('ID:', p.id);
    });
  } else {
    console.log('No Sunita found');
  }

  console.log('\n=== Recent Calls ===');
  const { data: allCalls } = await supabase
    .from('calls')
    .select('id, elderly_profile_id, created_at, duration_seconds, call_status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allCalls && allCalls.length > 0) {
    allCalls.forEach((c, i) => {
      const d = new Date(c.created_at);
      console.log(i + 1, d.toLocaleString(), c.duration_seconds + 's', c.call_status);
      console.log('  Profile:', c.elderly_profile_id.substring(0, 8));
    });
  } else {
    console.log('No calls in database');
  }
}

checkAllProfiles().catch(console.error);
