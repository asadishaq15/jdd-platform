-- Guest read of published Property Circle events + persisted RSVPs.

grant select on public.community_events to authenticated;

create policy "Guests can read published community events for their stays"
on public.community_events for select to authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.stays s
    where s.property_id = community_events.property_id
      and s.guest_id = (select auth.uid())
      and s.activated_at is not null
  )
);

create policy "Admins can read community events in their scope"
on public.community_events for select to authenticated
using (public.has_property_admin_access(property_id));

create table public.community_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  stay_id uuid references public.stays(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, guest_id)
);

create index community_event_rsvps_event_idx
on public.community_event_rsvps (event_id);

create index community_event_rsvps_property_idx
on public.community_event_rsvps (property_id, created_at desc);

create index community_event_rsvps_guest_idx
on public.community_event_rsvps (guest_id);

alter table public.community_event_rsvps enable row level security;

revoke all on public.community_event_rsvps from anon, authenticated;
grant select, insert on public.community_event_rsvps to authenticated;

create policy "Guests can read their community RSVPs"
on public.community_event_rsvps for select to authenticated
using ((select auth.uid()) = guest_id);

create policy "Guests can RSVP to published events for their stays"
on public.community_event_rsvps for insert to authenticated
with check (
  (select auth.uid()) = guest_id
  and exists (
    select 1
    from public.community_events e
    where e.id = event_id
      and e.is_published = true
      and e.property_id = community_event_rsvps.property_id
  )
  and exists (
    select 1
    from public.stays s
    where s.id = stay_id
      and s.guest_id = (select auth.uid())
      and s.property_id = community_event_rsvps.property_id
      and s.activated_at is not null
  )
);

create policy "Admins can read community RSVPs in their scope"
on public.community_event_rsvps for select to authenticated
using (public.has_property_admin_access(property_id));

comment on table public.community_event_rsvps is
  'Guest accept/reserve/save responses for Property Circle community events. One RSVP per guest per event.';
