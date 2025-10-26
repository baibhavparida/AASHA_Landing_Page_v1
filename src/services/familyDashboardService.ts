import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type ElderlyProfile = Database['public']['Tables']['elderly_profiles']['Row'];
type Alert = Database['public']['Tables']['family_member_alerts']['Row'];
type SharedContent = Database['public']['Tables']['shared_content']['Row'];
type ActivityLog = Database['public']['Tables']['family_activity_log']['Row'];
type ConversationPrompt = Database['public']['Tables']['conversation_prompts']['Row'];

export async function getElderlyProfilesForFamily() {
  // For demo purposes, use localStorage instead of auth
  const profileId = localStorage.getItem('aasha_profile_id');

  if (!profileId) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
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
    .eq('caregiver_profile_id', profileId);

  if (error) {
    console.error('Error fetching elderly profiles:', error);
    throw error;
  }

  return data || [];
}

export async function getElderlyProfileForFamily(elderlyProfileId: string) {
  // For demo purposes, use localStorage instead of auth
  const profileId = localStorage.getItem('aasha_profile_id');

  if (!profileId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('id', elderlyProfileId)
    .eq('caregiver_profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching elderly profile:', error);
    throw error;
  }

  return data;
}

export async function getFamilyAlerts(elderlyProfileId: string, unacknowledgedOnly = false) {
  // For demo purposes, use localStorage instead of auth
  const profileId = localStorage.getItem('aasha_profile_id');

  if (!profileId) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('family_member_alerts')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .eq('family_member_id', profileId)
    .order('created_at', { ascending: false });

  if (unacknowledgedOnly) {
    query = query.eq('is_acknowledged', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }

  return data || [];
}

export async function acknowledgeAlert(alertId: string) {
  const { data, error } = await supabase
    .from('family_member_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }

  return data;
}

export async function createAlert(alert: Database['public']['Tables']['family_member_alerts']['Insert']) {
  const { data, error } = await supabase
    .from('family_member_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    throw error;
  }

  return data;
}

export async function getSharedContent(elderlyProfileId: string) {
  const { data, error } = await supabase
    .from('shared_content')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shared content:', error);
    throw error;
  }

  return data || [];
}

export async function addSharedContent(content: Database['public']['Tables']['shared_content']['Insert']) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('shared_content')
    .insert({
      ...content,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding shared content:', error);
    throw error;
  }

  await logFamilyActivity({
    elderly_profile_id: content.elderly_profile_id,
    action_type: 'content_uploaded',
    entity_type: 'content',
    entity_id: data.id,
    description: `Uploaded content: ${content.title}`,
  });

  return data;
}

export async function updateSharedContent(contentId: string, updates: Database['public']['Tables']['shared_content']['Update']) {
  const { data, error } = await supabase
    .from('shared_content')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating shared content:', error);
    throw error;
  }

  return data;
}

export async function deleteSharedContent(contentId: string) {
  const { error } = await supabase
    .from('shared_content')
    .delete()
    .eq('id', contentId);

  if (error) {
    console.error('Error deleting shared content:', error);
    throw error;
  }
}

export async function getFamilyActivityLog(elderlyProfileId: string, limit = 50) {
  const { data, error } = await supabase
    .from('family_activity_log')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }

  return data || [];
}

export async function logFamilyActivity(activity: Omit<Database['public']['Tables']['family_activity_log']['Insert'], 'family_member_id'>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('family_activity_log')
    .insert({
      ...activity,
      family_member_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    throw error;
  }

  return data;
}

export async function getConversationPrompts(elderlyProfileId: string) {
  const { data, error } = await supabase
    .from('conversation_prompts')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversation prompts:', error);
    throw error;
  }

  return data || [];
}

export async function addConversationPrompt(prompt: Omit<Database['public']['Tables']['conversation_prompts']['Insert'], 'created_by'>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('conversation_prompts')
    .insert({
      ...prompt,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding conversation prompt:', error);
    throw error;
  }

  return data;
}

export async function updateConversationPrompt(promptId: string, updates: Database['public']['Tables']['conversation_prompts']['Update']) {
  const { data, error } = await supabase
    .from('conversation_prompts')
    .update(updates)
    .eq('id', promptId)
    .select()
    .single();

  if (error) {
    console.error('Error updating conversation prompt:', error);
    throw error;
  }

  return data;
}

export async function deleteConversationPrompt(promptId: string) {
  const { error } = await supabase
    .from('conversation_prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    console.error('Error deleting conversation prompt:', error);
    throw error;
  }
}

export async function getMedicationAdherenceStats(elderlyProfileId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: medications, error: medError } = await supabase
    .from('medications')
    .select('id')
    .eq('elderly_profile_id', elderlyProfileId);

  if (medError) {
    console.error('Error fetching medications:', medError);
    throw medError;
  }

  if (!medications || medications.length === 0) {
    return {
      totalScheduled: 0,
      totalTaken: 0,
      totalMissed: 0,
      totalSkipped: 0,
      adherenceRate: 0,
    };
  }

  const medicationIds = medications.map(m => m.id);

  const { data: tracking, error: trackError } = await supabase
    .from('medication_tracking')
    .select('status')
    .in('medication_id', medicationIds)
    .gte('scheduled_datetime', startDate.toISOString());

  if (trackError) {
    console.error('Error fetching medication tracking:', trackError);
    throw trackError;
  }

  const trackingData = tracking || [];
  const totalScheduled = trackingData.length;
  const totalTaken = trackingData.filter(t => t.status === 'taken').length;
  const totalMissed = trackingData.filter(t => t.status === 'missed').length;
  const totalSkipped = trackingData.filter(t => t.status === 'skipped').length;
  const adherenceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

  return {
    totalScheduled,
    totalTaken,
    totalMissed,
    totalSkipped,
    adherenceRate,
  };
}
