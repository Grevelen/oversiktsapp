-- Overs: konto, husholdning og sikker deling av økonomidata.
-- Kjør i Supabase SQL Editor etter at prosjektet er opprettet.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.household_role as enum ('owner', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email citext not null,
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- V1 lagrer dagens AppData samlet. revision gir optimistisk låsing og hindrer stille overskriving.
create table public.household_data (
  household_id uuid primary key references public.households(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index household_members_user_id_idx on public.household_members(user_id);
create index household_invitations_email_idx on public.household_invitations(email);

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_household(household_name text, initial_payload jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.households (name, created_by)
  values (trim(household_name), auth.uid()) returning id into new_id;
  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');
  insert into public.household_data (household_id, payload, updated_by)
  values (new_id, coalesce(initial_payload, '{}'::jsonb), auth.uid());
  return new_id;
end;
$$;

create or replace function public.create_household_invitation(target_household uuid, invite_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare invite_token uuid;
begin
  if not public.is_household_owner(target_household) then raise exception 'Only owner can invite'; end if;
  delete from public.household_invitations
  where household_id = target_household and email = lower(trim(invite_email)) and accepted_at is null;
  insert into public.household_invitations (household_id, email, invited_by)
  values (target_household, lower(trim(invite_email)), auth.uid())
  returning token into invite_token;
  return invite_token;
end;
$$;

create or replace function public.accept_household_invitation(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare invitation public.household_invitations%rowtype;
declare current_email text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select lower(email) into current_email from auth.users where id = auth.uid();
  select * into invitation from public.household_invitations
  where token = invite_token and accepted_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invitation is invalid or expired'; end if;
  if lower(invitation.email::text) <> current_email then raise exception 'Invitation belongs to another email address'; end if;
  insert into public.household_members (household_id, user_id, role)
  values (invitation.household_id, auth.uid(), 'member')
  on conflict do nothing;
  update public.household_invitations set accepted_at = now() where id = invitation.id;
  return invitation.household_id;
end;
$$;

create or replace function public.update_household_data(
  target_household uuid,
  next_payload jsonb,
  expected_revision bigint
)
returns public.household_data
language plpgsql
security definer
set search_path = public
as $$
declare result public.household_data;
begin
  if not public.is_household_member(target_household) then raise exception 'Access denied'; end if;
  update public.household_data
  set payload = next_payload,
      revision = revision + 1,
      updated_by = auth.uid(),
      updated_at = now()
  where household_id = target_household and revision = expected_revision
  returning * into result;
  if not found then raise exception 'Revision conflict'; end if;
  return result;
end;
$$;

grant execute on function public.create_household(text, jsonb) to authenticated;
grant execute on function public.create_household_invitation(uuid, text) to authenticated;
grant execute on function public.accept_household_invitation(uuid) to authenticated;
grant execute on function public.update_household_data(uuid, jsonb, bigint) to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.household_data enable row level security;

create policy profiles_select_self on public.profiles for select using (id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy households_select_member on public.households for select using (public.is_household_member(id));
create policy households_update_owner on public.households for update using (public.is_household_owner(id)) with check (public.is_household_owner(id));

create policy members_select_member on public.household_members for select using (public.is_household_member(household_id));
create policy invitations_select_owner on public.household_invitations for select using (public.is_household_owner(household_id));
create policy data_select_member on public.household_data for select using (public.is_household_member(household_id));

-- Realtime for household_data. Ignore duplicate publication membership if rerun manually.
do $$
begin
  alter publication supabase_realtime add table public.household_data;
exception when duplicate_object then null;
end $$;
