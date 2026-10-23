create table public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null unique references public.stays(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete restrict,
  sentiment text not null check (sentiment in ('at_home', 'some_parts', 'not_for_me', 'not_sure')),
  comment text check (comment is null or length(comment) <= 600),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index guest_feedback_property_submitted_idx
on public.guest_feedback (property_id, submitted_at desc)
where withdrawn_at is null;

create index guest_feedback_guest_idx
on public.guest_feedback (guest_id)
where withdrawn_at is null;

create trigger guest_feedback_set_updated_at
before update on public.guest_feedback
for each row execute procedure public.set_updated_at();

alter table public.guest_feedback enable row level security;
revoke all on public.guest_feedback from anon, authenticated;
grant select on public.guest_feedback to authenticated;

create policy "Guests can read their own feedback"
on public.guest_feedback for select to authenticated
using ((select auth.uid()) = guest_id);

create policy "Admins can read feedback in their scope"
on public.guest_feedback for select to authenticated
using (public.has_property_admin_access(property_id));

comment on table public.guest_feedback is
  'One editable post-stay sentiment response per stay. Withdrawn responses are excluded from reporting.';
