-- Storage bucket for profile avatars + banners.
-- The browser uploads directly (Next Server Actions cap request bodies at 1MB),
-- so RLS on storage.objects is the only gate: every object must live under
-- "<user-id>/...". Reads are public because the bucket backs public profiles.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- (select auth.uid()) rather than bare auth.uid() so the planner hoists it to an
-- InitPlan instead of re-evaluating per row — same form as the comments/reposts
-- policies in this schema.

drop policy if exists "profile media is publicly readable" on storage.objects;
create policy "profile media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'profile-media');

drop policy if exists "users can upload their own profile media" on storage.objects;
create policy "users can upload their own profile media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users can update their own profile media" on storage.objects;
create policy "users can update their own profile media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users can delete their own profile media" on storage.objects;
create policy "users can delete their own profile media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
