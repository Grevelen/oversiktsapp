import { supabase } from './supabase';

export async function deleteCurrentAccount() {
  const { error } = await supabase.rpc('delete_current_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
