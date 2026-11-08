-- Overs: full kontosletting og opprydding av brukerdata.
create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare owned_with_others integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select count(*) into owned_with_others
  from public.household_members owner_membership
  where owner_membership.user_id = auth.uid()
    and owner_membership.role = 'owner'
    and exists (
      select 1 from public.household_members other_membership
      where other_membership.household_id = owner_membership.household_id
        and other_membership.user_id <> auth.uid()
    );

  if owned_with_others > 0 then
    raise exception 'Transfer or remove group members before deleting account';
  end if;

  -- Delete groups where the user is the only member. Cascades remove group data and codes.
  delete from public.households h
  using public.household_members hm
  where h.id = hm.household_id
    and hm.user_id = auth.uid()
    and hm.role = 'owner'
    and not exists (
      select 1 from public.household_members other_membership
      where other_membership.household_id = h.id
        and other_membership.user_id <> auth.uid()
    );

  delete from public.household_members where user_id = auth.uid();
  delete from public.user_data where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_current_account() to authenticated;
