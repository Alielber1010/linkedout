-- avoid the auth_rls_initplan perf warning by evaluating auth.uid() once
-- per query instead of once per row (comments is new, no legacy rows to
-- worry about breaking)
alter policy "users can insert their own comments"
  on public.comments
  with check ((select auth.uid()) = profile_id);

alter policy "users can delete their own comments"
  on public.comments
  using ((select auth.uid()) = profile_id);
