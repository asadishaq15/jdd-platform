-- Public-read storage for Property Circle community thumbnails.
-- Uploads are performed by the admin service-role client only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-thumbnails',
  'community-thumbnails',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Allow anyone to read public thumbnail objects (guest Space <img>).
drop policy if exists "Public read community thumbnails" on storage.objects;
create policy "Public read community thumbnails"
on storage.objects for select
to public
using (bucket_id = 'community-thumbnails');
