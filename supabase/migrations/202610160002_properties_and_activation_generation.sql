insert into public.properties (slug, name, country, world_number)
values
  ('forma-house', 'Forma House', 'Italy', 1),
  ('veil-retreat', 'Veil Retreat', 'Bhutan', 2),
  ('willow-estate', 'Willow Estate', 'England', 3),
  ('sierra-reserve', 'Sierra Reserve', 'Switzerland', 4),
  ('cedar-house', 'Cedar House', 'Japan', 5),
  ('liora-estate', 'Liora Estate', 'Portugal', 6),
  ('coyote-lodge', 'Coyote Lodge', 'United States', 7),
  ('equa-retreat', 'Equa Retreat', 'Sweden', 8),
  ('serein-kyoto', 'Serein Kyoto', 'Japan', 9),
  ('alba-springs', 'Alba Springs', 'Iceland', 10),
  ('brio-lodge', 'Brio Lodge', 'Costa Rica', 11),
  ('oblique-house', 'Oblique House', 'Denmark', 12),
  ('ebb-sanctuary', 'Ebb Sanctuary', 'Indonesia', 13),
  ('cala-retreat', 'Cala Retreat', 'Greece', 14),
  ('ember-palace', 'Ember Palace', 'Morocco', 15),
  ('wildrock-lodge', 'Wildrock Lodge', 'Namibia', 16),
  ('aster-house', 'Aster House', 'France', 17),
  ('nocturne-retreat', 'Nocturne Retreat', 'Oman', 18),
  ('lucent-estate', 'Lucent Estate', 'Spain', 19),
  ('aurora-reserve', 'Aurora Reserve', 'Norway', 20),
  ('terra-estate', 'Terra Estate', 'New Zealand', 21),
  ('nomad-lodge', 'Nomad Lodge', 'Chile', 22)
on conflict (slug) do update
set
  name = excluded.name,
  country = excluded.country,
  world_number = excluded.world_number,
  is_active = true;

create or replace function public.create_guest_activation(
  p_stay_id uuid,
  p_expires_at timestamptz default (now() + interval '7 days')
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_token text;
begin
  if p_expires_at <= now() then
    raise exception 'Activation expiry must be in the future.';
  end if;

  if not exists (select 1 from public.stays where id = p_stay_id) then
    raise exception 'Stay not found.';
  end if;

  generated_token := encode(extensions.gen_random_bytes(32), 'hex');

  update public.guest_activation_links
  set revoked_at = now()
  where stay_id = p_stay_id
    and consumed_at is null
    and revoked_at is null;

  insert into public.guest_activation_links (stay_id, token_hash, expires_at)
  values (
    p_stay_id,
    encode(extensions.digest(generated_token, 'sha256'), 'hex'),
    p_expires_at
  );

  return query select generated_token, p_expires_at;
end;
$$;

revoke all on function public.create_guest_activation(uuid, timestamptz)
from public, anon, authenticated;
grant execute on function public.create_guest_activation(uuid, timestamptz)
to service_role;

