import { createClient } from "@/lib/supabase/server";
import { ComposeBox } from "@/components/compose-box";
import { TagFilter } from "@/components/tag-filter";
import { PostCard } from "@/components/post-card";
import type { ReactionType } from "@/lib/tags";

const EMPTY_COUNTS: Record<ReactionType, number> = {
  been_there: 0,
  same: 0,
  red_flag: 0,
  escaped: 0,
  corporate: 0,
};

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

  let query = supabase
    .from("posts")
    .select(
      "id, body, role, company, tags, created_at, profiles!posts_profile_id_fkey(user_number), reactions(profile_id, reaction_type)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (tag) query = query.contains("tags", [tag]);

  const { data: posts } = await query;

  return (
    <div>
      <h1 className="sr-only">LinkedOut feed</h1>

      <div className="mb-4">
        <TagFilter />
      </div>

      <ComposeBox />

      <div className="space-y-4">
        {posts?.length ? (
          posts.map((post) => {
            const profile = Array.isArray(post.profiles)
              ? post.profiles[0]
              : post.profiles;
            const counts = { ...EMPTY_COUNTS };
            let mine: ReactionType | null = null;

            for (const r of post.reactions ?? []) {
              const type = r.reaction_type as ReactionType;
              counts[type] = (counts[type] ?? 0) + 1;
              if (user && r.profile_id === user.id) mine = type;
            }

            return (
              <PostCard
                key={post.id}
                id={post.id}
                body={post.body}
                role={post.role}
                company={post.company}
                tags={post.tags ?? []}
                createdAt={post.created_at}
                userNumber={profile?.user_number ?? 0}
                counts={counts}
                mine={mine}
              />
            );
          })
        ) : (
          <p className="text-center text-secondary py-12">
            No confessions yet. Be the first to break the NDA. (Kidding —
            please don&apos;t actually break your NDA.)
          </p>
        )}
      </div>
    </div>
  );
}
