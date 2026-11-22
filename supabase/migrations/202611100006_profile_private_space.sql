-- Guest/member dashboard snapshot (demo codes, intentions, byProp, local orders, etc.)

alter table public.profiles
  add column if not exists private_space jsonb not null default '{}'::jsonb,
  add column if not exists private_space_updated_at timestamptz;

comment on column public.profiles.private_space is
  'Serialized Space dashboard progress: codes, intentions, card/RSVP demo state, byProp.';
comment on column public.profiles.private_space_updated_at is
  'Last time private_space was written from the client dashboard.';