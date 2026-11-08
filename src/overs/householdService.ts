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

export type GroupMember = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: 'owner' | 'member';
  joined_at: string;
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
  const { data, error } = await supabase.from('household_data').select('*').eq('household_id', householdId).single();
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
  const { data, error } = await supabase.rpc('accept_household_invitation', { invite_token: token });
  if (error) throw error;
  return data as string;
}

export async function renameGroup(householdId: string, name: string) {
  const { error } = await supabase.rpc('rename_household', { target_household: householdId, next_name: name });
  if (error) throw error;
}

export async function getGroupMembers(householdId: string) {
  const { data, error } = await supabase.rpc('get_group_members', { target_household: householdId });
  if (error) throw error;
  return (data || []) as GroupMember[];
}

export async function removeGroupMember(householdId: string, userId: string) {
  const { error } = await supabase.rpc('remove_group_member', { target_household: householdId, target_user: userId });
  if (error) throw error;
}

export async function deleteGroup(householdId: string) {
  const { error } = await supabase.rpc('delete_household', { target_household: householdId });
  if (error) throw error;
}

export function subscribeToHousehold(householdId: string, onChange: (record: HouseholdDataRecord) => void): RealtimeChannel {
  return supabase.channel(`household:${householdId}`).on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'household_data', filter: `household_id=eq.${householdId}` },
    (event) => {
      const row = event.new as HouseholdDataRecord;
      onChange({ ...row, payload: migrateAppData(row.payload) });
    },
  ).subscribe();
}

export async function unsubscribeFromHousehold(channel: RealtimeChannel) {
  await supabase.removeChannel(channel);
}
