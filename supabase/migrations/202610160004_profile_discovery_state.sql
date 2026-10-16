alter table public.profiles
  add column recommended_world_number smallint
    check (recommended_world_number between 1 and 22),
  add column chosen_world_number smallint
    check (chosen_world_number between 1 and 22),
  add column discovery_completed_at timestamptz;

comment on column public.profiles.recommended_world_number is
  'World derived from discovery. The date of birth itself is not retained.';

comment on column public.profiles.chosen_world_number is
  'World selected by the member at the end of discovery.';

comment on column public.profiles.discovery_completed_at is
  'Set after the member finishes or skips the final discovery prompts.';
