-- Overs: privat skysynk per bruker + 8-sifrede engangskoder for grupper.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy user_data_select_self on public.user_data
for select using (user_id = auth.uid());

create or replace function public.bootstrap_user_data(initial_payload jsonb)
returns public.user_data
language plpgsql
security definer
set search_path = public
as $$
declare result public.user_data;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.user_data(user_id, payload)
  values (auth.uid(), coalesce(initial_payload, '{}'::jsonb))
  on conflict (user_id) do nothing;
  select * into result from public.user_data where user_id = auth.uid();
  return result;
end;
$$;

create or replace function public.update_user_data(next_payload jsonb, expected_revision bigint)
returns public.user_data
language plpgsql
security definer
set search_path = public
as $$
declare result public.user_data;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.user_data
  set payload = next_payload,
      revision = revision + 1,
      updated_at = now()
  where user_id = auth.uid() and revision = expected_revision
  returning * into result;
  if not found then raise exception 'Revision conflict'; end if;
  return result;
end;
$$;

create table if not exists public.group_invite_codes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.group_invite_codes enable row level security;

create policy group_codes_select_owner on public.group_invite_codes
for select using (public.is_household_owner(household_id));

create or replace function public.create_group_invite_code(target_household uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare raw_code text;
declare hashed_code text;
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can invite'; end if;
  -- Only one active owner-created code is needed at a time.
  delete from public.group_invite_codes
  where household_id = target_household and used_at is null;
  loop
    raw_code := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    hashed_code := encode(digest(raw_code, 'sha256'), 'hex');
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
set search_path = public
as $$
declare invite public.group_invite_codes%rowtype;
declare normalized text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  normalized := regexp_replace(raw_code, '[^0-9]', '', 'g');
  if char_length(normalized) <> 8 then raise exception 'Invalid invite code'; end if;
  select * into invite
  from public.group_invite_codes
  where code_hash = encode(digest(normalized, 'sha256'), 'hex')
    and used_at is null
    and expires_at > now()
  for update;
  if not found then raise exception 'Invite code is invalid or expired'; end if;
  insert into public.household_members(household_id, user_id, role)
  values(invite.household_id, auth.uid(), 'member')
  on conflict do nothing;
  update public.group_invite_codes
  set used_at = now(), used_by = auth.uid()
  where id = invite.id;
  return invite.household_id;
end;
$$;

grant execute on function public.bootstrap_user_data(jsonb) to authenticated;
grant execute on function public.update_user_data(jsonb, bigint) to authenticated;
grant execute on function public.create_group_invite_code(uuid) to authenticated;
grant execute on function public.accept_group_invite_code(text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.user_data;
exception when duplicate_object then null;
end $$;
