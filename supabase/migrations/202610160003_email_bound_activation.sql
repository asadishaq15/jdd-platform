create or replace function public.redeem_guest_activation(p_token text)
returns table (stay_id uuid, property_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  activation public.guest_activation_links%rowtype;
  target_stay public.stays%rowtype;
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_user_confirmed_at timestamptz;
begin
  if current_user_id is null or length(p_token) < 32 then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  select * into activation
  from public.guest_activation_links
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if activation.id is null
    or activation.consumed_at is not null
    or activation.revoked_at is not null
    or activation.expires_at <= now() then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  select * into target_stay
  from public.stays
  where id = activation.stay_id
  for update;

  if target_stay.id is null
    or (target_stay.guest_id is not null and target_stay.guest_id <> current_user_id) then
    raise exception 'Activation link is invalid or unavailable.';
  end if;

  if target_stay.guest_email is not null and btrim(target_stay.guest_email) <> '' then
    select lower(btrim(email)), email_confirmed_at
    into current_user_email, current_user_confirmed_at
    from auth.users
    where id = current_user_id;

    if current_user_confirmed_at is null
      or current_user_email is null
      or current_user_email <> lower(btrim(target_stay.guest_email)) then
      raise exception 'Please sign in with the verified email address that received this invitation.';
    end if;
  end if;

  update public.guest_activation_links
  set consumed_at = now(), consumed_by = current_user_id
  where id = activation.id;

  update public.stays
  set guest_id = current_user_id, activated_at = coalesce(activated_at, now())
  where id = activation.stay_id;

  return query
  select target_stay.id, target_stay.property_id;
end;
$$;

revoke all on function public.redeem_guest_activation(text)
from public, anon;
grant execute on function public.redeem_guest_activation(text)
to authenticated;

