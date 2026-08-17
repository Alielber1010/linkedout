-- Atomic toggle: does the read-then-write in one DB transaction so rapid
-- concurrent clicks can't race each other into an inconsistent state (the
-- old client-side select-then-branch pattern could miss a delete if two
-- requests both read "nothing exists yet" before either committed).
-- security invoker: runs as the calling role, so existing RLS policies
-- on reactions still gate everything.
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
