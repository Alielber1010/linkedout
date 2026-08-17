-- LinkedOut database schema snapshot
-- Pulled from Supabase project "LinkedOut" (ref: arhmvwxhbuylvkujnmib) on 2026-08-16.
-- This is a point-in-time dump of the remote schema for reference/version control.
-- It does NOT replace real migration history. Remote migrations already applied
-- (mirrored as local files under supabase/migrations/ starting 20260816082751):
--   20260803082039  init_schema
--   20260803082106  lock_down_trigger_function
--   20260807155238  add_profile_identity_and_company_history
--   20260808070447  add_default_anonymous_to_profiles
--   20260815122649  lock_down_handle_new_user_rpc
--   20260815180126  drop_posts_role_and_company
--   20260815180426  add_profile_usernames
--   20260816082751  add_comments_and_post_views
--   20260816082814  optimize_comments_rls_initplan
--   20260816093129  add_reposts
--   20260816093908  add_quoted_post_to_posts
--   20260817104813  add_toggle_reaction_rpc
--   20260817104852  add_toggle_repost_rpc
--
-- To make future changes safely: use the Supabase MCP `apply_migration` (or `supabase db query`
-- once the CLI is linked), which writes a matching file under supabase/migrations/ — keep this
-- snapshot in sync afterward.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles: one row per auth.users user, auto-created via trigger on signup
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  user_number        integer not null default nextval('public.profiles_user_number_seq'::regclass),
  created_at         timestamptz not null default now(),
  display_name       text,
  headline           text,
  username           text not null,
  default_anonymous  boolean not null default false,
  constraint display_name_length check (display_name is null or (char_length(display_name) between 1 and 60)),
  constraint headline_length check (headline is null or (char_length(headline) between 1 and 120)),
  constraint profiles_username_key unique (username),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

create sequence public.profiles_user_number_seq
  as integer
  start 1
  minval 1
  maxval 2147483647
  increment 1
  owned by public.profiles.user_number;

-- posts: the confessions feed
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  body          text not null,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  is_anonymous  boolean not null default false,
  views         integer not null default 0,
  quoted_post_id uuid references public.posts (id) on delete set null,
  constraint posts_body_check check (char_length(body) between 1 and 2000)
);

create index posts_created_at_idx on public.posts using btree (created_at desc);
create index posts_tags_idx on public.posts using gin (tags);
create index posts_quoted_post_id_idx on public.posts using btree (quoted_post_id);

-- reactions: one reaction per (post, profile)
create table public.reactions (
  post_id        uuid not null references public.posts (id) on delete cascade,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  reaction_type  text not null,
  created_at     timestamptz not null default now(),
  primary key (post_id, profile_id),
  constraint reactions_reaction_type_check check (
    reaction_type = any (array['been_there', 'same', 'red_flag', 'escaped', 'corporate'])
  )
);

-- reposts: one repost per (post, profile)
create table public.reposts (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index reposts_profile_id_idx on public.reposts using btree (profile_id);

-- profile_companies: a user's work history ("company status" tags shown on profile)
create table public.profile_companies (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  company     text not null,
  status      text not null,
  created_at  timestamptz not null default now(),
  constraint profile_companies_company_check check (char_length(company) between 1 and 100),
  constraint profile_companies_status_check check (
    status = any (array['left', 'fired', 'laid_off', 'escaped', 'ghosted'])
  )
);

create index profile_companies_profile_id_idx on public.profile_companies using btree (profile_id);

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

-- ============================================================================
-- Functions & triggers
-- ============================================================================

-- Auto-create a profile row whenever a new auth user signs up, with a
-- default unique username derived from the user_number sequence (grabbed
-- once so both columns stay in sync — using each column's own default
-- would call nextval() twice and desync them).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  next_number integer;
begin
  next_number := nextval('public.profiles_user_number_seq');
  insert into public.profiles (id, user_number, username)
  values (new.id, next_number, 'user' || next_number)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER functions in `public` are callable by anon/authenticated
-- via PostgREST RPC by default. This one only needs to run as the auth
-- trigger, so lock direct RPC access down.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- posts.views: simple counter, bumped only via this narrow security-definer
-- RPC — posts has no RLS update policy today and this doesn't add one.
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

-- Atomic toggles: read-then-write in one DB transaction so rapid concurrent
-- clicks can't race each other into an inconsistent state.
create or replace function public.toggle_reaction(p_post_id uuid, p_reaction_type text)
returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
begin
  delete from public.reactions
  where post_id = p_post_id
    and profile_id = auth.uid()
    and reaction_type = p_reaction_type;

  if not found then
    insert into public.reactions (post_id, profile_id, reaction_type)
    values (p_post_id, auth.uid(), p_reaction_type)
    on conflict (post_id, profile_id) do update set reaction_type = excluded.reaction_type;
  end if;
end;
$$;

grant execute on function public.toggle_reaction(uuid, text) to authenticated;
revoke execute on function public.toggle_reaction(uuid, text) from public, anon;

create or replace function public.toggle_repost(p_post_id uuid)
returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
begin
  delete from public.reposts
  where post_id = p_post_id
    and profile_id = auth.uid();

  if not found then
    insert into public.reposts (post_id, profile_id)
    values (p_post_id, auth.uid())
    on conflict (post_id, profile_id) do nothing;
  end if;
end;
$$;

grant execute on function public.toggle_repost(uuid) to authenticated;
revoke execute on function public.toggle_repost(uuid) from public, anon;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.profile_companies enable row level security;
alter table public.comments enable row level security;
alter table public.reposts enable row level security;

-- profiles
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- posts
create policy "posts are publicly readable"
  on public.posts for select
  using (true);

create policy "users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = profile_id);

create policy "users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = profile_id);

-- reactions
create policy "reactions are publicly readable"
  on public.reactions for select
  using (true);

create policy "users can upsert their own reactions"
  on public.reactions for insert
  with check (auth.uid() = profile_id);

create policy "users can update their own reactions"
  on public.reactions for update
  using (auth.uid() = profile_id);

create policy "users can delete their own reactions"
  on public.reactions for delete
  using (auth.uid() = profile_id);

-- profile_companies
create policy "company history is publicly readable"
  on public.profile_companies for select
  using (true);

create policy "users can insert their own company history"
  on public.profile_companies for insert
  with check (auth.uid() = profile_id);

create policy "users can delete their own company history"
  on public.profile_companies for delete
  using (auth.uid() = profile_id);

-- comments
create policy "comments are publicly readable"
  on public.comments for select
  using (true);

create policy "users can insert their own comments"
  on public.comments for insert
  with check ((select auth.uid()) = profile_id);

create policy "users can delete their own comments"
  on public.comments for delete
  using ((select auth.uid()) = profile_id);

-- reposts
create policy "reposts are publicly readable"
  on public.reposts for select
  using (true);

create policy "users can insert their own reposts"
  on public.reposts for insert
  with check ((select auth.uid()) = profile_id);

create policy "users can delete their own reposts"
  on public.reposts for delete
  using ((select auth.uid()) = profile_id);
