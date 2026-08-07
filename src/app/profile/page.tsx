import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
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
        <div className="px-5 pb-5 -mt-8">
          <div className="h-16 w-16 rounded-full bg-background border-4 border-surface flex items-center justify-center text-2xl font-bold text-primary">
            {initial}
          </div>
          <h1 className="mt-3 text-xl font-bold">{displayName}</h1>
          <p className="text-secondary text-sm">
            {profile?.headline || "No headline. No ambition either."}
          </p>
          <p className="text-xs text-secondary mt-1">
            User #{profile?.user_number} · here since{" "}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "forever"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold mb-3">Edit profile</h2>
        <ProfileForm
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
