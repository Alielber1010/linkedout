import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/search-bar";
import { Feed } from "@/components/feed";
import { PAGE_SIZE, POSTS_SELECT, mapPost, type MappedPost, type PostRow } from "@/lib/posts";

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

  let posts: MappedPost[] = [];

  if (query) {
    const pattern = toIlikePattern(query);
    const { data } = await supabase
      .from("posts")
      .select(POSTS_SELECT)
      .ilike("body", pattern)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<PostRow[]>();
    posts = (data ?? []).map((row) => mapPost(row, user?.id ?? null));
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Search LinkedOut</h1>

      <SearchBar />

      {!query && (
        <p className="text-center text-secondary py-12">
          Search rants by keyword.
        </p>
      )}

      {query && (
        <Feed
          initialPosts={posts}
          hasMoreInitially={false}
          emptyMessage={`Nothing matches "${query}". Maybe your workplace is the only one that bad.`}
        />
      )}
    </div>
  );
}
