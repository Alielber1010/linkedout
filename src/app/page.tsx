import { createClient } from "@/lib/supabase/server";
import { ComposeBox } from "@/components/compose-box";
import { TagFilter } from "@/components/tag-filter";
import { Feed } from "@/components/feed";
import { PAGE_SIZE, POSTS_SELECT, mapPost } from "@/lib/posts";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaultAnonymous = false;
  let avatarSeed = "guest";
  let avatarInitial = "?";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_anonymous, display_name, user_number")
      .eq("id", user.id)
      .single();
    defaultAnonymous = profile?.default_anonymous ?? false;
    avatarSeed = user.id;
    const name = profile?.display_name || `Anonymous #${profile?.user_number ?? 0}`;
    avatarInitial = name.trim().charAt(0).toUpperCase() || "A";
  }

  let query = supabase
    .from("posts")
    .select(POSTS_SELECT)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (tag) query = query.contains("tags", [tag]);

  const { data } = await query;
  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const posts = rows.slice(0, PAGE_SIZE).map((row) => mapPost(row, user?.id ?? null));

  return (
    <div>
      <h1 className="sr-only">LinkedOut feed</h1>

      <div className="mb-4">
        <TagFilter />
      </div>

      <ComposeBox
        defaultAnonymous={defaultAnonymous}
        avatarSeed={avatarSeed}
        avatarInitial={avatarInitial}
      />

      <Feed
        initialPosts={posts}
        tag={tag}
        hasMoreInitially={hasMore}
        emptyMessage="No confessions yet. Be the first to break the NDA. (Kidding — please don't actually break your NDA.)"
      />
    </div>
  );
}
