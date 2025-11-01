import { supabase } from '../lib/supabase';

export async function getDailyMedicineLogs(elderlyProfileId: string, startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('daily_medicine_log')
    .select('*')
    .eq('elderly_profile_id', elderlyProfileId)
    .gte('log_date', startDate.toISOString().split('T')[0])
    .lte('log_date', endDate.toISOString().split('T')[0])
    .order('log_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function logDailyMedicine(elderlyProfileId: string, logDate: Date, medicineTaken: boolean, callId?: string) {
  const { data, error } = await supabase
    .from('daily_medicine_log')
    .insert({
      elderly_profile_id: elderlyProfileId,
      log_date: logDate.toISOString().split('T')[0],
      medicine_taken: medicineTaken,
      call_id: callId || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDailyMedicineLog(logId: string, medicineTaken: boolean) {
  const { data, error } = await supabase
    .from('daily_medicine_log')
    .update({ medicine_taken: medicineTaken })
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
