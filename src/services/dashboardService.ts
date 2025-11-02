import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type ElderlyProfile = Database['public']['Tables']['elderly_profiles']['Row'];
type Medication = Database['public']['Tables']['medications']['Row'];
type Interest = Database['public']['Tables']['interests']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];
type CallAnalysis = Database['public']['Tables']['call_analysis']['Row'];
type CallTranscript = Database['public']['Tables']['call_transcripts']['Row'];
type SpecialEvent = Database['public']['Tables']['special_events']['Row'];
type MedicationTracking = Database['public']['Tables']['medication_tracking']['Row'];

export async function getElderlyProfileForUser() {
  // For demo purposes, use localStorage instead of auth
  const profileId = localStorage.getItem('aasha_profile_id');

  if (!profileId) {
    console.error('No profile ID in localStorage');
    throw new Error('User not authenticated');
  }

  console.log('Loading elderly profile for user:', profileId);

  // Check if profile exists in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, registration_type')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError) {
    console.error('Error checking profile in profiles table:', profileError);
    console.error('Full error details:', JSON.stringify(profileError, null, 2));
    throw new Error('Failed to verify user profile. Please try logging in again.');
  }

  if (!profile) {
    console.error('Profile not found in profiles table for ID:', profileId);
    throw new Error('Profile not found. Please complete registration.');
  }

  console.log('Profile found with registration_type:', profile.registration_type);

  // Find elderly profile by profile_id (for 'myself' registration)
  const { data, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching elderly profile:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    console.error('Query details: profile_id =', profileId);
    throw new Error('Failed to load profile data. Please try again.');
  }

  if (!data) {
    console.error('No elderly profile found for profile_id:', profileId);
    console.error('This means the query succeeded but returned no rows');
    throw new Error('Your profile setup is incomplete. Please complete the registration process.');
  }

  console.log('Elderly profile loaded successfully:', data.id);
  return data;
}

export async function updateElderlyProfile(profileId: string, updates: {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  marital_status?: string;
  call_time_preference?: string;
}) {
  const { data, error } = await supabase
    .from('elderly_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    console.error('Error updating elderly profile:', error);
    throw error;
  }

  return data;
}

export async function getMedications(elderlyProfileId: string) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }

  return data || [];
}

export async function addMedication(medication: {
  elderly_profile_id: string;
  name: string;
  dosage_quantity: number;
  times_of_day: string[];
}) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medication)
    .select()
    .single();

  if (error) {
    console.error('Error adding medication:', error);
    throw error;
  }

  return data;
}

export async function updateMedication(medicationId: string, updates: {
  name?: string;
  dosage_quantity?: number;
  times_of_day?: string[];
}) {
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', medicationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating medication:', error);
    throw error;
  }

  return data;
}

export async function deleteMedication(medicationId: string) {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', medicationId);

  if (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
}

export async function getMedicationTracking(medicationId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('medication_tracking')
    .select('*')
    .eq('medication_id', medicationId)
    .order('scheduled_datetime', { ascending: false });

  if (startDate) {
    query = query.gte('scheduled_datetime', startDate);
  }

  if (endDate) {
    query = query.lte('scheduled_datetime', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching medication tracking:', error);
    throw error;
  }

  return data || [];
}

export async function trackMedicationTaken(medicationId: string, scheduledDatetime: string, status: 'taken' | 'missed' | 'skipped', notes?: string) {
  const { data, error } = await supabase
    .from('medication_tracking')
    .insert({
      medication_id: medicationId,
      scheduled_datetime: scheduledDatetime,
      taken_datetime: status === 'taken' ? new Date().toISOString() : null,
      status,
      notes: notes || '',
    })
    .select()
    .single();

  if (error) {
    console.error('Error tracking medication:', error);
    throw error;
  }

  return data;
}

export async function getCalls(elderlyProfileId: string, limit?: number) {
  let query = supabase
    .from('calls')
    .select(`
      *,
      call_analysis(*),
      call_transcripts(*)
    `)
    .eq('elderly_profile_id', elderlyProfileId)
    .neq('call_type', 'onboarding')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching calls:', error);
    throw error;
  }

  // Flatten the call_transcripts array to get llm_call_summary
  const processedData = (data || []).map(call => ({
    ...call,
    llm_call_summary: call.call_transcripts?.[0]?.llm_call_summary || null
  }));

  return processedData;
}

export async function getCall(callId: string) {
  const { data, error } = await supabase
    .from('calls')
    .select(`
      *,
      call_analysis(*),
      call_transcripts(*)
    `)
    .eq('id', callId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching call:', error);
    throw error;
  }

  return data;
}

export async function getInterests(elderlyProfileId: string) {
  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId);

  if (error) {
    console.error('Error fetching interests:', error);
    throw error;
  }

  return data || [];
}

export async function addInterest(elderlyProfileId: string, interest: string) {
  const { data, error } = await supabase
    .from('interests')
    .insert({
      elderly_profile_id: elderlyProfileId,
      interest,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding interest:', error);
    throw error;
  }

  return data;
}

export async function deleteInterest(interestId: string) {
  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('id', interestId);

  if (error) {
    console.error('Error deleting interest:', error);
    throw error;
  }
}

export async function getSpecialEvents(elderlyProfileId: string) {
  const { data, error } = await supabase
    .from('special_events')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching special events:', error);
    throw error;
  }

  return data || [];
}

export async function addSpecialEvent(event: {
  elderly_profile_id: string;
  event_name: string;
  event_date: string;
  event_type: 'birthday' | 'anniversary' | 'appointment' | 'family_visit' | 'holiday' | 'other';
  description?: string;
  is_recurring?: boolean;
}) {
  const { data, error } = await supabase
    .from('special_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error adding special event:', error);
    throw error;
  }

  return data;
}

export async function updateSpecialEvent(eventId: string, updates: Database['public']['Tables']['special_events']['Update']) {
  const { data, error } = await supabase
    .from('special_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating special event:', error);
    throw error;
  }

  return data;
}

export async function deleteSpecialEvent(eventId: string) {
  const { error } = await supabase
    .from('special_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting special event:', error);
    throw error;
  }
}
