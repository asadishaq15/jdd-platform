-- Property Circle community events: one Event, one Guest invitation, one News per property.

create table public.community_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null check (category in ('event', 'invite', 'news')),
  title text not null check (length(btrim(title)) between 2 and 160),
  timing text not null check (length(btrim(timing)) between 1 and 120),
  body text not null check (length(btrim(body)) between 1 and 2000),
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, category)
);

create index community_events_property_idx
on public.community_events (property_id);

create index community_events_category_idx
on public.community_events (category);

create trigger community_events_set_updated_at
before update on public.community_events
for each row execute procedure public.set_updated_at();

alter table public.community_events enable row level security;

revoke all on public.community_events from anon, authenticated;

comment on table public.community_events is
  'Property Circle slots: at most one event, invite, and news item per property. Service-role access from admin UI.';
