import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppData } from './model';
import { migrateAppData } from './model';
import { supabase } from './supabase';

export type HouseholdDataRecord = {
  household_id: string;
  payload: AppData;
  revision: number;
  updated_by: string | null;
  updated_at: string;
};

export async function createHousehold(name: string, localData: AppData) {
  const { data, error } = await supabase.rpc('create_household', {
    household_name: name,
    initial_payload: migrateAppData(localData),
  });
  if (error) throw error;
  return data as string;
}

export async function getMyHouseholds() {
  const { data, error } = await supabase
    .from('household_members')
    .select('role, joined_at, households(id, name, created_at)')
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function loadHouseholdData(householdId: string) {
  const { data, error } = await supabase
    .from('household_data')
    .select('*')
    .eq('household_id', householdId)
    .single();
  if (error) throw error;
  return { ...data, payload: migrateAppData(data.payload) } as HouseholdDataRecord;
}

export async function saveHouseholdData(householdId: string, payload: AppData, revision: number) {
  const { data, error } = await supabase.rpc('update_household_data', {
    target_household: householdId,
    next_payload: migrateAppData(payload),
    expected_revision: revision,
  });
  if (error) throw error;
  return { ...data, payload: migrateAppData(data.payload) } as HouseholdDataRecord;
}

export async function createInvitation(householdId: string, email: string) {
  const { data, error } = await supabase.rpc('create_household_invitation', {
    target_household: householdId,
    invite_email: email,
  });
  if (error) throw error;
  return data as string;
}

export async function acceptInvitation(token: string) {
  const { data, error } = await supabase.rpc('accept_household_invitation', {
    invite_token: token,
  });
  if (error) throw error;
  return data as string;
}

export function subscribeToHousehold(
  householdId: string,
  onChange: (record: HouseholdDataRecord) => void,
): RealtimeChannel {
  return supabase
    .channel(`household:${householdId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'household_data', filter: `household_id=eq.${householdId}` },
      (event) => {
        const row = event.new as HouseholdDataRecord;
        onChange({ ...row, payload: migrateAppData(row.payload) });
      },
    )
    .subscribe();
}

export async function unsubscribeFromHousehold(channel: RealtimeChannel) {
  await supabase.removeChannel(channel);
}
