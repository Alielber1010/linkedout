alter table public.posts
  add column quoted_post_id uuid references public.posts (id) on delete set null;

create index posts_quoted_post_id_idx on public.posts using btree (quoted_post_id);
