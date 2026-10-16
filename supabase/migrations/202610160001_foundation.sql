create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text,
  world_number smallint not null check (world_number between 1 and 22),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  guest_id uuid references auth.users(id) on delete set null,
  guest_name text,
  guest_email text,
  external_reference text unique,
  check_in date,
  check_out date,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_stay_dates check (
    check_in is null or check_out is null or check_out >= check_in
  )
);

create table public.guest_activation_links (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.stays(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activation_consumption_complete check (
    (consumed_at is null and consumed_by is null)
    or (consumed_at is not null and consumed_by is not null)
  )
);

create index stays_guest_id_idx on public.stays(guest_id);
create index stays_property_id_idx on public.stays(property_id);
create index guest_activation_links_stay_id_idx on public.guest_activation_links(stay_id);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.stays enable row level security;
alter table public.guest_activation_links enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.properties from anon, authenticated;
revoke all on public.stays from anon, authenticated;
revoke all on public.guest_activation_links from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.properties to anon, authenticated;
grant select on public.stays to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Active properties are readable"
on public.properties for select to anon, authenticated
using (is_active = true);

create policy "Guests can read their own stays"
on public.stays for select to authenticated
using ((select auth.uid()) = guest_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute procedure public.set_updated_at();

create trigger stays_set_updated_at
before update on public.stays
for each row execute procedure public.set_updated_at();

create or replace function public.redeem_guest_activation(p_token text)
returns table (stay_id uuid, property_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  activation public.guest_activation_links%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or length(p_token) < 32 then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  select * into activation
  from public.guest_activation_links
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if activation.id is null
    or activation.consumed_at is not null
    or activation.revoked_at is not null
    or activation.expires_at <= now() then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  if exists (
    select 1 from public.stays s
    where s.id = activation.stay_id
      and s.guest_id is not null
      and s.guest_id <> current_user_id
  ) then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  update public.guest_activation_links
  set consumed_at = now(), consumed_by = current_user_id
  where id = activation.id;

  update public.stays s
  set guest_id = current_user_id, activated_at = coalesce(s.activated_at, now())
  where s.id = activation.stay_id;

  return query
  select s.id, s.property_id
  from public.stays s
  where s.id = activation.stay_id;
end;
$$;

revoke all on function public.redeem_guest_activation(text) from public, anon;
grant execute on function public.redeem_guest_activation(text) to authenticated;

