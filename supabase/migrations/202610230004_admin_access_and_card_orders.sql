-- One invited administrative account owns each property scope. Internal staff
-- remain global super administrators and are not affected by this constraint.
create unique index admin_memberships_one_active_account_per_property_idx
on public.admin_memberships (property_id)
where property_id is not null and is_active;

-- Administrative data is only available to sessions that completed MFA.
create or replace function public.admin_mfa_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke all on function public.admin_mfa_verified() from public, anon;
grant execute on function public.admin_mfa_verified() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.admin_mfa_verified() and exists (
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
  select public.admin_mfa_verified() and exists (
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
  select public.admin_mfa_verified() and (
    public.is_super_admin() or exists (
      select 1
      from public.admin_memberships membership
      where membership.user_id = auth.uid()
        and membership.property_id = p_property_id
        and membership.is_active
    )
  );
$$;

create table public.card_orders (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references auth.users(id) on delete cascade,
  stay_id uuid references public.stays(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete restrict,
  recipient_name text not null check (length(btrim(recipient_name)) between 2 and 120),
  shipping_address text not null check (length(btrim(shipping_address)) between 8 and 500),
  status text not null default 'requested' check (
    status in ('requested', 'preparing', 'sent', 'delivered', 'received', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index card_orders_property_created_idx
on public.card_orders (property_id, created_at desc);

create index card_orders_guest_created_idx
on public.card_orders (guest_id, created_at desc);

create trigger card_orders_set_updated_at
before update on public.card_orders
for each row execute procedure public.set_updated_at();

alter table public.card_orders enable row level security;
revoke all on public.card_orders from anon, authenticated;
grant select on public.card_orders to authenticated;

create policy "Guests can read their card orders"
on public.card_orders for select to authenticated
using ((select auth.uid()) = guest_id);

create policy "MFA admins can read card orders in their scope"
on public.card_orders for select to authenticated
using (public.has_property_admin_access(property_id));

comment on table public.card_orders is
  'Scented-card fulfilment requests. Payment credentials are never collected or stored.';
