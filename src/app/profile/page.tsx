import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile-header";
import { CompanyHistory } from "@/components/company-history";
import { ProfilePosts } from "@/components/profile-posts";
import { POSTS_SELECT, mapPost } from "@/lib/posts";

const PROFILE_POSTS_LIMIT = 50;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-center text-secondary py-12">Not signed in.</p>;
  }

  const [{ data: profile }, { data: companies }, { data: postRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_number, display_name, headline, username, created_at, bio, location, website, avatar_url, banner_url"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_companies")
      .select("id, company, status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select(POSTS_SELECT)
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PROFILE_POSTS_LIMIT),
  ]);

  const posts = (postRows ?? []).map((row) => mapPost(row, user.id));

  const displayName = profile?.display_name ?? `Anonymous #${profile?.user_number}`;
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="space-y-6">
      <ProfileHeader
        initial={initial}
        userNumber={profile?.user_number}
        createdAt={profile?.created_at ?? null}
        initialDisplayName={profile?.display_name ?? ""}
        initialHeadline={profile?.headline ?? ""}
        initialUsername={profile?.username ?? ""}
        initialBio={profile?.bio ?? ""}
        initialLocation={profile?.location ?? ""}
        initialWebsite={profile?.website ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initialBannerUrl={profile?.banner_url ?? null}
      />

      <div className="rounded-xl border border-border bg-surface p-5">
        <CompanyHistory initialEntries={companies ?? []} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-secondary">
          Your confessions
        </h2>
        <ProfilePosts initialPosts={posts} />
      </div>
    </div>
  );
}
