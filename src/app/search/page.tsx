import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/search-bar";
import { PostCard } from "@/components/post-card";
import type { ReactionType } from "@/lib/tags";

const EMPTY_COUNTS: Record<ReactionType, number> = {
  been_there: 0,
  same: 0,
  red_flag: 0,
  escaped: 0,
  corporate: 0,
};

// PostgREST treats a double-quoted filter value as one literal token, so
// wrapping the term neutralizes the comma/paren syntax `.or()` otherwise
// parses out of raw input. Only the quote and backslash need escaping.
function toIlikePattern(term: string) {
  const escaped = term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let posts: Awaited<ReturnType<typeof runSearch>> = [];

  async function runSearch() {
    const pattern = toIlikePattern(query);
    const { data } = await supabase
      .from("posts")
      .select(
        "id, body, role, company, tags, created_at, is_anonymous, profiles!posts_profile_id_fkey(user_number, display_name, headline), reactions(profile_id, reaction_type)"
      )
      .or(
        `body.ilike.${pattern},company.ilike.${pattern},role.ilike.${pattern}`
      )
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  }

  if (query) {
    posts = await runSearch();
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Search LinkedOut</h1>

      <SearchBar />

      {!query && (
        <p className="text-center text-secondary py-12">
          Search rants by role, company, or keyword.
        </p>
      )}

      {query && posts.length === 0 && (
        <p className="text-center text-secondary py-12">
          Nothing matches &quot;{query}&quot;. Maybe your workplace is the
          only one that bad.
        </p>
      )}

      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => {
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
                displayName={profile?.display_name ?? null}
                headline={profile?.headline ?? null}
                isAnonymous={post.is_anonymous}
                counts={counts}
                mine={mine}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
