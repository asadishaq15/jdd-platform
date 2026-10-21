alter table public.guest_activation_links
drop constraint if exists activation_consumption_complete;

alter table public.guest_activation_links
add constraint activation_consumption_complete check (
  consumed_by is null or consumed_at is not null
);

comment on constraint activation_consumption_complete on public.guest_activation_links is
  'A consuming user requires a consumed timestamp. The user reference may be cleared when that account is deleted.';
