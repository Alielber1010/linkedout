-- Same atomic-toggle fix as toggle_reaction, applied to reposts.
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
