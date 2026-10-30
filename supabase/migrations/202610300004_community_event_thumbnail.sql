-- Optional thumbnail image URL for Property Circle community events.

alter table public.community_events
  add column if not exists thumbnail_url text
  check (
    thumbnail_url is null
    or (
      length(btrim(thumbnail_url)) between 1 and 2000
      and thumbnail_url ~* '^https?://'
    )
  );

comment on column public.community_events.thumbnail_url is
  'Optional https image URL for the community event thumbnail.';
