-- Append-only view events for Property Circle News (one row per detail open).

create table public.community_event_views (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  stay_id uuid references public.stays(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index community_event_views_event_idx
on public.community_event_views (event_id);

create index community_event_views_property_idx
on public.community_event_views (property_id, created_at desc);

create index community_event_views_guest_idx
on public.community_event_views (guest_id);

alter table public.community_event_views enable row level security;

revoke all on public.community_event_views from anon, authenticated;
grant select, insert on public.community_event_views to authenticated;

create policy "Guests can read their community news views"
on public.community_event_views for select to authenticated
using ((select auth.uid()) = guest_id);

create policy "Guests can record views for published news in their stays"
on public.community_event_views for insert to authenticated
with check (
  (select auth.uid()) = guest_id
  and exists (
    select 1
    from public.community_events e
    where e.id = event_id
      and e.category = 'news'
      and e.is_published = true
      and e.property_id = community_event_views.property_id
      and e.visible_from is not null
      and e.visible_until is not null
      and now() >= e.visible_from
      and now() < e.visible_until
  )
  and exists (
    select 1
    from public.stays s
    where s.id = stay_id
      and s.guest_id = (select auth.uid())
      and s.property_id = community_event_views.property_id
      and s.activated_at is not null
  )
);

create policy "Admins can read community news views in their scope"
on public.community_event_views for select to authenticated
using (public.has_property_admin_access(property_id));

comment on table public.community_event_views is
  'Guest opens of Property Circle News detail. Append-only; multiple views per guest allowed.';
