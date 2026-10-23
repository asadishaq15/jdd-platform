create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'activation_page_opened',
    'activation_completed',
    'discovery_started',
    'discovery_completed',
    'world_viewed',
    'world_chosen',
    'space_opened',
    'ritual_opened',
    'property_circle_opened'
  )),
  user_id uuid references auth.users(id) on delete set null,
  stay_id uuid references public.stays(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  session_id text check (session_id is null or length(session_id) between 8 and 100),
  metadata jsonb not null default '{}'::jsonb,
  is_internal boolean not null default false,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index product_events_occurred_idx
on public.product_events (occurred_at desc);

create index product_events_property_occurred_idx
on public.product_events (property_id, occurred_at desc);

create index product_events_user_occurred_idx
on public.product_events (user_id, occurred_at desc);

create index product_events_name_occurred_idx
on public.product_events (event_name, occurred_at desc);

alter table public.product_events enable row level security;
revoke all on public.product_events from anon, authenticated;
grant select on public.product_events to authenticated;

create policy "Admins can read product events in their scope"
on public.product_events for select to authenticated
using (
  public.is_super_admin()
  or (property_id is not null and public.has_property_admin_access(property_id))
);

comment on table public.product_events is
  'Append-only, server-recorded product journey events. Free-text guest reflections must never be stored in metadata.';

comment on column public.product_events.is_internal is
  'True when the actor has an active admin membership; excluded from analytics by default.';
