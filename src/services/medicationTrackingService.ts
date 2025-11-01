import { supabase } from '../lib/supabase';

export async function getMedicationTracking(elderlyProfileId: string, startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('medication_tracking')
    .select(`
      *,
      medication:medications(*)
    `)
    .gte('scheduled_datetime', startDate.toISOString())
    .lte('scheduled_datetime', endDate.toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (error) throw error;

  const medicationsMap = new Map();

  if (data) {
    for (const tracking of data) {
      if (tracking.medication && tracking.medication.elderly_profile_id === elderlyProfileId) {
        if (!medicationsMap.has(tracking.medication.id)) {
          medicationsMap.set(tracking.medication.id, {
            ...tracking.medication,
            trackings: []
          });
        }
        medicationsMap.get(tracking.medication.id).trackings.push(tracking);
      }
    }
  }

  return Array.from(medicationsMap.values());
}

export async function logMedicationTaken(medicationId: string, scheduledDatetime: Date, takenDatetime: Date) {
  const { data, error } = await supabase
    .from('medication_tracking')
    .insert({
      medication_id: medicationId,
      scheduled_datetime: scheduledDatetime.toISOString(),
      taken_datetime: takenDatetime.toISOString(),
      status: 'taken'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedicationStatus(trackingId: string, status: 'taken' | 'missed' | 'skipped', notes?: string) {
  const updateData: any = { status };

  if (status === 'taken' && !notes) {
    updateData.taken_datetime = new Date().toISOString();
  }

  if (notes) {
    updateData.notes = notes;
  }

  const { data, error } = await supabase
    .from('medication_tracking')
    .update(updateData)
    .eq('id', trackingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
