import { createClient } from "@/lib/supabase/server";
import { AnonymousDefaultToggle } from "@/components/anonymous-default-toggle";
import { AppearanceToggle } from "@/components/appearance-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { LinkAccountForm } from "@/components/link-account-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-center text-secondary py-12">Not signed in.</p>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_anonymous")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold mb-4">Posting</h2>
        <AnonymousDefaultToggle
          initialValue={profile?.default_anonymous ?? false}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold mb-4">Appearance</h2>
        <AppearanceToggle />
      </div>

      {user.is_anonymous && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold mb-4">Save your account</h2>
          <LinkAccountForm />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold mb-4">Account</h2>
        <SignOutButton className="rounded-full border border-primary text-primary hover:bg-primary hover:text-white text-sm font-medium px-4 py-1.5 transition-colors">
          Sign out
        </SignOutButton>
      </div>
    </div>
  );
}
