-- Overs: eieradministrasjon av grupper.

create or replace function public.rename_household(target_household uuid, next_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can rename group'; end if;
  if char_length(trim(next_name)) < 1 or char_length(trim(next_name)) > 80 then raise exception 'Invalid group name'; end if;
  update public.households set name = trim(next_name), updated_at = now() where id = target_household;
end;
$$;

create or replace function public.get_group_members(target_household uuid)
returns table(user_id uuid, email text, display_name text, role public.household_role, joined_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select hm.user_id, u.email::text, p.display_name, hm.role, hm.joined_at
  from public.household_members hm
  join auth.users u on u.id = hm.user_id
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = target_household
    and public.is_household_member(target_household)
  order by case when hm.role = 'owner' then 0 else 1 end, hm.joined_at;
$$;

create or replace function public.remove_group_member(target_household uuid, target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can remove members'; end if;
  if target_user = auth.uid() then raise exception 'Owner cannot remove self'; end if;
  delete from public.household_members
  where household_id = target_household and user_id = target_user and role <> 'owner';
end;
$$;

create or replace function public.delete_household(target_household uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can delete group'; end if;
  delete from public.households where id = target_household;
end;
$$;

grant execute on function public.rename_household(uuid, text) to authenticated;
grant execute on function public.get_group_members(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.delete_household(uuid) to authenticated;
