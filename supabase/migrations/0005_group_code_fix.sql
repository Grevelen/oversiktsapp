-- Overs: make group-code hashing explicitly use pgcrypto from extensions schema.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_group_invite_code(target_household uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare raw_code text;
declare hashed_code text;
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can invite'; end if;
  delete from public.group_invite_codes where household_id = target_household and used_at is null;
  loop
    raw_code := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    hashed_code := encode(extensions.digest(raw_code, 'sha256'), 'hex');
    exit when not exists(select 1 from public.group_invite_codes where code_hash = hashed_code);
  end loop;
  insert into public.group_invite_codes(household_id, code_hash, created_by)
  values (target_household, hashed_code, auth.uid());
  return raw_code;
end;
$$;

create or replace function public.accept_group_invite_code(raw_code text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare invite public.group_invite_codes%rowtype;
declare normalized text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  normalized := regexp_replace(raw_code, '[^0-9]', '', 'g');
  if char_length(normalized) <> 8 then raise exception 'Invalid invite code'; end if;
  select * into invite from public.group_invite_codes
  where code_hash = encode(extensions.digest(normalized, 'sha256'), 'hex')
    and used_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invite code is invalid or expired'; end if;
  insert into public.household_members(household_id, user_id, role)
  values(invite.household_id, auth.uid(), 'member') on conflict do nothing;
  update public.group_invite_codes set used_at = now(), used_by = auth.uid() where id = invite.id;
  return invite.household_id;
end;
$$;

grant execute on function public.create_group_invite_code(uuid) to authenticated;
grant execute on function public.accept_group_invite_code(text) to authenticated;
