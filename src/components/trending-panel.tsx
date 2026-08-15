import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TRENDING_SAMPLE_SIZE = 200;
const TRENDING_LIMIT = 8;

export async function TrendingPanel() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("tags")
    .order("created_at", { ascending: false })
    .limit(TRENDING_SAMPLE_SIZE);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const trending = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TRENDING_LIMIT);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <h2 className="px-4 py-3 font-bold text-lg border-b border-border">
        Trending grievances
      </h2>

      {trending.length === 0 ? (
        <p className="px-4 py-6 text-sm text-secondary">
          Nothing&apos;s trending yet. Suspiciously quiet in here.
        </p>
      ) : (
        <ul>
          {trending.map(([tag, count]) => (
            <li key={tag}>
              <Link
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="block px-4 py-3 hover:bg-background transition-colors"
              >
                <p className="text-sm font-semibold text-foreground">#{tag}</p>
                <p className="text-xs text-secondary">
                  {count} {count === 1 ? "confession" : "confessions"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
