-- Guest invitation invitees: only invited guests see the invite slot in Space.

create table public.community_event_invitees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  stay_id uuid not null references public.stays(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  guest_email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  email_sent_at timestamptz,
  email_warning text,
  unique (event_id, guest_id),
  unique (event_id, stay_id)
);

create index community_event_invitees_event_idx
on public.community_event_invitees (event_id);

create index community_event_invitees_property_idx
on public.community_event_invitees (property_id, invited_at desc);

create index community_event_invitees_guest_idx
on public.community_event_invitees (guest_id);

create or replace function public.community_event_invitees_enforce_invite()
returns trigger
language plpgsql
as $$
declare
  event_category text;
  event_property uuid;
begin
  select category, property_id
  into event_category, event_property
  from public.community_events
  where id = new.event_id;

  if event_category is null then
    raise exception 'Community event not found.';
  end if;

  if event_category <> 'invite' then
    raise exception 'Invitees are only allowed on Guest invitation slots.';
  end if;

  if new.property_id <> event_property then
    raise exception 'Invitee property must match the invitation property.';
  end if;

  return new;
end;
$$;

create trigger community_event_invitees_enforce_invite
before insert or update on public.community_event_invitees
for each row
execute function public.community_event_invitees_enforce_invite();

alter table public.community_event_invitees enable row level security;

revoke all on public.community_event_invitees from anon, authenticated;
grant select on public.community_event_invitees to authenticated;

create policy "Guests can read their community invitees"
on public.community_event_invitees for select to authenticated
using ((select auth.uid()) = guest_id);

create policy "Admins can read community invitees in their scope"
on public.community_event_invitees for select to authenticated
using (public.has_property_admin_access(property_id));

comment on table public.community_event_invitees is
  'Guests invited to a Property Circle Guest invitation. Service-role writes from admin UI.';

-- Tighten guest read: invite category requires invitee membership.
drop policy if exists "Guests can read published community events for their stays"
on public.community_events;

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
  and (
    category <> 'invite'
    or exists (
      select 1
      from public.community_event_invitees i
      where i.event_id = community_events.id
        and i.guest_id = (select auth.uid())
    )
  )
);

-- Tighten RSVP insert for invite category.
drop policy if exists "Guests can RSVP to published events for their stays"
on public.community_event_rsvps;

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
      and (
        e.category <> 'invite'
        or exists (
          select 1
          from public.community_event_invitees i
          where i.event_id = e.id
            and i.guest_id = (select auth.uid())
        )
      )
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
