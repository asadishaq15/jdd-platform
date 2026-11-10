-- Retain date of birth so Space can show the member's zodiac sign.
-- Discovery previously discarded DOB after deriving recommended_world_number.

alter table public.profiles
  add column if not exists date_of_birth date;

comment on column public.profiles.date_of_birth is
  'Member date of birth from discovery. Used for zodiac display in Space; Matrix world uses recommended_world_number.';

comment on column public.profiles.recommended_world_number is
  'World derived from discovery Matrix of Destiny (from date of birth).';
