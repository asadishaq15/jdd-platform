create table public.admin_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  role text not null check (role in ('super_admin', 'property_admin', 'property_staff', 'analyst')),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_membership_scope check (
    (role = 'super_admin' and property_id is null)
    or (role <> 'super_admin' and property_id is not null)
  )
);

create unique index admin_memberships_global_user_idx
on public.admin_memberships (user_id)
where property_id is null;

create unique index admin_memberships_property_user_idx
on public.admin_memberships (user_id, property_id)
where property_id is not null;

create index admin_memberships_property_idx
on public.admin_memberships (property_id)
where is_active = true;

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  action text not null check (length(btrim(action)) between 3 and 120),
  resource_type text not null check (length(btrim(resource_type)) between 2 and 80),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_property_created_idx
on public.admin_audit_logs (property_id, created_at desc);

create index admin_audit_logs_actor_created_idx
on public.admin_audit_logs (actor_id, created_at desc);

create trigger admin_memberships_set_updated_at
before update on public.admin_memberships
for each row execute procedure public.set_updated_at();

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_memberships from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_memberships to authenticated;
grant select on public.admin_audit_logs to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships membership
    where membership.user_id = auth.uid()
      and membership.is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships membership
    where membership.user_id = auth.uid()
      and membership.role = 'super_admin'
      and membership.is_active
  );
$$;

create or replace function public.has_property_admin_access(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.admin_memberships membership
    where membership.user_id = auth.uid()
      and membership.property_id = p_property_id
      and membership.is_active
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.has_property_admin_access(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.has_property_admin_access(uuid) to authenticated;

create policy "Admins can read their memberships"
on public.admin_memberships for select to authenticated
using ((select auth.uid()) = user_id or public.is_super_admin());

create policy "Admins can read properties in their scope"
on public.properties for select to authenticated
using (public.has_property_admin_access(id));

create policy "Admins can read audit logs in their scope"
on public.admin_audit_logs for select to authenticated
using (
  public.is_super_admin()
  or (property_id is not null and public.has_property_admin_access(property_id))
);

create or replace function public.record_admin_audit(
  p_action text,
  p_resource_type text,
  p_resource_id text default null,
  p_property_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_log_id bigint;
begin
  if current_user_id is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if p_property_id is null and not public.is_super_admin() then
    raise exception 'A property scope is required.';
  end if;

  if p_property_id is not null and not public.has_property_admin_access(p_property_id) then
    raise exception 'You do not have access to this property.';
  end if;

  insert into public.admin_audit_logs (
    actor_id,
    property_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) values (
    current_user_id,
    p_property_id,
    btrim(p_action),
    btrim(p_resource_type),
    p_resource_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_log_id;

  return new_log_id;
end;
$$;

revoke all on function public.record_admin_audit(text, text, text, uuid, jsonb)
from public, anon;
grant execute on function public.record_admin_audit(text, text, text, uuid, jsonb)
to authenticated;

comment on table public.admin_memberships is
  'Property-scoped and global administrative access. Only super_admin memberships are global.';

comment on table public.admin_audit_logs is
  'Append-only record of sensitive administrative actions. Write through record_admin_audit.';
