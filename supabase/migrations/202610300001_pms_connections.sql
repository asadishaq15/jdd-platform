-- Manual PMS connection storage for admin Integrations (first pass).
-- Tokens are never exposed to authenticated clients; admin UI uses the service role.

create table public.pms_connections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  provider text not null check (provider in ('cloudbeds', 'mews')),
  external_property_id text not null check (length(btrim(external_property_id)) between 1 and 120),
  access_token text,
  token_last_four text check (token_last_four is null or length(token_last_four) = 4),
  status text not null default 'disconnected' check (
    status in ('connected', 'disconnected', 'error')
  ),
  last_sync_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pms_connections_connected_token_check check (
    status <> 'connected'
    or (access_token is not null and length(btrim(access_token)) > 0 and token_last_four is not null)
  )
);

create index pms_connections_provider_idx
on public.pms_connections (provider);

create index pms_connections_status_idx
on public.pms_connections (status);

create trigger pms_connections_set_updated_at
before update on public.pms_connections
for each row execute procedure public.set_updated_at();

alter table public.pms_connections enable row level security;

revoke all on public.pms_connections from anon, authenticated;

comment on table public.pms_connections is
  'Per-property PMS credentials and connection status. Service-role access only; admin UI never returns access_token.';
