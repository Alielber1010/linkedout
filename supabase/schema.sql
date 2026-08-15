-- LinkedOut database schema snapshot
-- Pulled from Supabase project "LinkedOut" (ref: arhmvwxhbuylvkujnmib) on 2026-08-15.
-- This is a point-in-time dump of the remote schema for reference/version control.
-- It does NOT replace real migration history. Remote migrations already applied
-- (tracked by Supabase, not yet mirrored as local files):
--   20260803082039  init_schema
--   20260803082106  lock_down_trigger_function
--   20260807155238  add_profile_identity_and_company_history
--   20260808070447  add_default_anonymous_to_profiles
--
-- To make future changes safely: use the Supabase MCP `execute_sql` (or `supabase db query`
-- once the CLI is linked) to iterate, then commit a proper migration file under
-- supabase/migrations/ before applying to production.

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
  default_anonymous  boolean not null default false,
  constraint display_name_length check (display_name is null or (char_length(display_name) between 1 and 60)),
  constraint headline_length check (headline is null or (char_length(headline) between 1 and 120))
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
  role          text,
  company       text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  is_anonymous  boolean not null default false,
  constraint posts_body_check check (char_length(body) between 1 and 2000)
);

create index posts_created_at_idx on public.posts using btree (created_at desc);
create index posts_tags_idx on public.posts using gin (tags);

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

-- ============================================================================
-- Functions & triggers
-- ============================================================================

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.profile_companies enable row level security;

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
