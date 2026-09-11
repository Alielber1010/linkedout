import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { AnonymousDefaultToggle } from "@/components/anonymous-default-toggle";
import { AppearanceToggle } from "@/components/appearance-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { LinkAccountForm } from "@/components/link-account-form";

function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
      {children}
    </div>
  );
}

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
    .select("display_name, username, avatar_url, user_number, default_anonymous")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name?.trim() || `Anonymous #${profile?.user_number}`;
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      <SettingsGroup
        title="Account"
        description="Who you are around here, and how you get back in."
      >
        <SettingsCard>
          <div className="flex items-center gap-3 px-5 py-4">
            <Avatar content={initial} size={48} src={profile?.avatar_url ?? null} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              {profile?.username && (
                <p className="truncate text-xs text-secondary">
                  @{profile.username}
                </p>
              )}
              <p className="mt-0.5 truncate text-xs text-secondary">
                {user.email ?? "No email — you're a ghost."}
              </p>
            </div>
          </div>

          <Link
            href="/profile"
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <span>
              <span className="block text-sm font-medium">Edit profile</span>
              <span className="mt-0.5 block text-xs text-secondary">
                Name, headline, bio, location, website, photos — everything
                people quietly judge.
              </span>
            </span>
            <ChevronRight
              size={18}
              className="shrink-0 text-secondary"
              aria-hidden
            />
          </Link>

          {user.is_anonymous && (
            <div className="px-5 py-4">
              <p className="text-sm font-medium">Save your account</p>
              <div className="mt-2">
                <LinkAccountForm />
              </div>
            </div>
          )}
        </SettingsCard>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <SignOutButton className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:opacity-50">
            <span>
              <span className="block text-sm font-medium text-primary">
                Sign out
              </span>
              <span className="mt-0.5 block text-xs text-secondary">
                {user.is_anonymous
                  ? "Heads up: a ghost account with no email can't be recovered. Save it first."
                  : "You can log back in with your email whenever the rage returns."}
              </span>
            </span>
            <LogOut size={18} className="shrink-0 text-primary" aria-hidden />
          </SignOutButton>
        </div>
      </SettingsGroup>

      <SettingsGroup
        title="Preferences"
        description="How the app behaves while you use it."
      >
        <SettingsCard>
          <div className="px-5 py-4">
            <AnonymousDefaultToggle
              initialValue={profile?.default_anonymous ?? false}
            />
          </div>
          <div className="px-5 py-4">
            <AppearanceToggle />
          </div>
        </SettingsCard>
      </SettingsGroup>
    </div>
  );
}
