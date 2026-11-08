-- Overs: allow authenticated users to read only their own private cloud row.
-- RLS policy user_data_select_self continues to enforce user_id = auth.uid().

grant usage on schema public to authenticated;
grant select on table public.user_data to authenticated;
revoke all on table public.user_data from anon;

-- Keep writes behind security-definer RPC functions with revision control.
grant execute on function public.bootstrap_user_data(jsonb) to authenticated;
grant execute on function public.update_user_data(jsonb, bigint) to authenticated;

-- Ensure RLS remains enabled and the self-only policy is present exactly once.
alter table public.user_data enable row level security;
drop policy if exists user_data_select_self on public.user_data;
create policy user_data_select_self
on public.user_data
for select
to authenticated
using (user_id = auth.uid());

-- Ensure user_data is available to Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.user_data;
exception
  when duplicate_object then null;
end $$;
