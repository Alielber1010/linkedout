-- X-style "Edit profile": extra profile detail fields + media URLs.
-- `headline` stays as its own field alongside `bio` (deliberate: both exist).
-- The existing "users can update their own profile" RLS policy
-- (using/with check auth.uid() = id) already covers these new columns —
-- column-level grants are unchanged, so nothing needs loosening.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists avatar_url text,
  add column if not exists banner_url text;

alter table public.profiles
  add constraint bio_length
  check (bio is null or (char_length(bio) between 1 and 160));

alter table public.profiles
  add constraint location_length
  check (location is null or (char_length(location) between 1 and 30));

alter table public.profiles
  add constraint website_length
  check (website is null or (char_length(website) between 1 and 200));
