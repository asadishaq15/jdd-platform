-- Member location shown on New Space identity slide ("Based in").

alter table public.profiles
  add column if not exists based_in text;

comment on column public.profiles.based_in is
  'Optional member location label shown in Space (e.g. New York).';
