import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile-header";
import { CompanyHistory } from "@/components/company-history";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-center text-secondary py-12">Not signed in.</p>;
  }

  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_number, display_name, headline, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_companies")
      .select("id, company, status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const displayName = profile?.display_name ?? `Anonymous #${profile?.user_number}`;
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden border border-border bg-surface">
        <div className="h-20 bg-primary" />
        <ProfileHeader
          initial={initial}
          userNumber={profile?.user_number}
          createdAt={profile?.created_at ?? null}
          initialDisplayName={profile?.display_name ?? ""}
          initialHeadline={profile?.headline ?? ""}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <CompanyHistory initialEntries={companies ?? []} />
      </div>
    </div>
  );
}
