-- Development-only seed. Run after both migrations in supabase/migrations.
-- It creates/updates one test stay and returns a new seven-day activation link.

with selected_property as (
  select id
  from public.properties
  where slug = 'serein-kyoto'
),
upserted_stay as (
  insert into public.stays (
    property_id,
    guest_name,
    guest_email,
    external_reference,
    check_in,
    check_out
  )
  select
    id,
    'Muhammad Jahanzeb',
    'jhnzkhl383@gmail.com',
    'JDD-TEST-2026-001',
    date '2026-10-20',
    date '2026-10-24'
  from selected_property
  on conflict (external_reference) do update
  set
    property_id = excluded.property_id,
    guest_name = excluded.guest_name,
    guest_email = excluded.guest_email,
    check_in = excluded.check_in,
    check_out = excluded.check_out
  returning id
),
activation as (
  select generated.token, generated.expires_at
  from upserted_stay
  cross join lateral public.create_guest_activation(
    upserted_stay.id,
    now() + interval '7 days'
  ) as generated
)
select
  'http://localhost:3000/activate/' || token as activation_url,
  expires_at
from activation;

