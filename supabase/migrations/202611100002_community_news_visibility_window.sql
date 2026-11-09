-- News-only guest visibility window (show from → until).
-- Event and invite keep null windows and remain unaffected.

alter table public.community_events
  add column if not exists visible_from timestamptz,
  add column if not exists visible_until timestamptz;

alter table public.community_events
  drop constraint if exists community_events_visibility_window_pair;

alter table public.community_events
  add constraint community_events_visibility_window_pair
  check (
    (visible_from is null and visible_until is null)
    or (
      visible_from is not null
      and visible_until is not null
      and visible_until > visible_from
    )
  );

alter table public.community_events
  drop constraint if exists community_events_visibility_news_only;

alter table public.community_events
  add constraint community_events_visibility_news_only
  check (
    category = 'news'
    or (visible_from is null and visible_until is null)
  );

comment on column public.community_events.visible_from is
  'News only: guests can see the item starting at this time (inclusive).';
comment on column public.community_events.visible_until is
  'News only: guests stop seeing the item at this time (exclusive).';

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
  and (
    category <> 'news'
    or (
      visible_from is not null
      and visible_until is not null
      and now() >= visible_from
      and now() < visible_until
    )
  )
);
