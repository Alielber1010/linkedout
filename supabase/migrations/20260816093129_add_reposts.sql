create table public.reposts (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index reposts_profile_id_idx on public.reposts using btree (profile_id);

alter table public.reposts enable row level security;

create policy "reposts are publicly readable"
  on public.reposts for select
  using (true);

create policy "users can insert their own reposts"
  on public.reposts for insert
  with check ((select auth.uid()) = profile_id);

create policy "users can delete their own reposts"
  on public.reposts for delete
  using ((select auth.uid()) = profile_id);
