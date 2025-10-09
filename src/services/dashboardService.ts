import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type ElderlyProfile = Database['public']['Tables']['elderly_profiles']['Row'];
type Medication = Database['public']['Tables']['medications']['Row'];
type Interest = Database['public']['Tables']['interests']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type SpecialEvent = Database['public']['Tables']['special_events']['Row'];
type MedicationTracking = Database['public']['Tables']['medication_tracking']['Row'];

export async function getElderlyProfileForUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error checking profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    throw new Error('Profile not found. Please complete registration.');
  }

  const { data, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching elderly profile:', error);
    throw error;
  }

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

export async function getConversations(elderlyProfileId: string, limit?: number) {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('conversation_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching conversation:', error);
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
