-- comments: flat, one thread per post
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint comments_body_check check (char_length(body) between 1 and 2000)
);

create index comments_post_id_created_at_idx on public.comments using btree (post_id, created_at);

alter table public.comments enable row level security;

create policy "comments are publicly readable"
  on public.comments for select
  using (true);

create policy "users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = profile_id);

create policy "users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = profile_id);

-- posts.views: simple counter, bumped only via this narrow security-definer
-- RPC — posts has no RLS update policy today and this doesn't add one.
alter table public.posts add column views integer not null default 0;

create or replace function public.increment_post_views(post_id uuid)
returns void
language sql
security definer
set search_path = 'public'
as $$
  update public.posts set views = views + 1 where id = post_id;
$$;

revoke execute on function public.increment_post_views(uuid) from public, anon;
grant execute on function public.increment_post_views(uuid) to authenticated;
