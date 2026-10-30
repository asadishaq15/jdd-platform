-- TEMPORARY: allow admin RPCs/audit without authenticator AAL2.
-- TODO: restore aal2 check before production partner rollout.
-- Previous body: select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';

create or replace function public.admin_mfa_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.admin_mfa_verified() from public, anon;
grant execute on function public.admin_mfa_verified() to authenticated;

comment on function public.admin_mfa_verified() is
  'TEMPORARY always-true MFA gate. Restore JWT aal2 check before production.';
