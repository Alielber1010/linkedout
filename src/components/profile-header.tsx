"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateProfile } from "@/app/profile/actions";
import { Modal } from "@/components/modal";

export function ProfileHeader({
  initial,
  userNumber,
  createdAt,
  initialDisplayName,
  initialHeadline,
  initialUsername,
}: {
  initial: string;
  userNumber?: number;
  createdAt: string | null;
  initialDisplayName: string;
  initialHeadline: string;
  initialUsername: string;
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shownName = displayName || `Anonymous #${userNumber}`;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDisplayName(String(formData.get("display_name") ?? "").trim());
      setHeadline(String(formData.get("headline") ?? "").trim());
      setUsername(String(formData.get("username") ?? "").trim().toLowerCase());
      setEditing(false);
    });
  }

  return (
    <div className="relative px-5 pb-5 -mt-8">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit profile"
        title="Edit profile"
        className="absolute right-5 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-secondary hover:text-primary hover:border-primary transition-colors"
      >
        <Pencil size={16} />
      </button>

      <div className="h-16 w-16 rounded-full bg-surface border-4 border-background flex items-center justify-center text-2xl font-bold text-primary">
        {initial}
      </div>

      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <h1 className="text-xl font-bold">{shownName}</h1>
        {username && <span className="text-secondary text-sm">@{username}</span>}
      </div>
      <p className="text-secondary text-sm">
        {headline || "No headline. No ambition either."}
      </p>
      <p className="text-xs text-secondary mt-1">
        User #{userNumber} · here since{" "}
        {createdAt ? new Date(createdAt).toLocaleDateString() : "forever"}
      </p>

      {editing && (
        <Modal
          title="Edit profile"
          onClose={() => setEditing(false)}
          headerAction={
            <button
              type="submit"
              form="edit-profile-form"
              disabled={pending}
              className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          }
        >
          <form
            id="edit-profile-form"
            action={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Username
              </label>
              <div className="flex items-center rounded-md border border-border bg-background focus-within:border-primary">
                <span className="pl-3 text-sm text-secondary">@</span>
                <input
                  name="username"
                  defaultValue={username}
                  placeholder="user1234"
                  pattern="[a-z0-9_]{3,20}"
                  title="Lowercase letters, numbers, and underscores only — 3 to 20 characters"
                  maxLength={20}
                  required
                  className="w-full bg-transparent px-1.5 py-2 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-secondary">
                Lowercase letters, numbers, underscores. 3–20 characters. Has
                to be unique — no two ghosts can share a name.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Display name
              </label>
              <input
                name="display_name"
                defaultValue={displayName}
                placeholder="Anonymous #42 (or don't, we're not your boss)"
                maxLength={60}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Headline
              </label>
              <input
                name="headline"
                defaultValue={headline}
                placeholder="Senior Software Engineer @ [redacted] (send help)"
                maxLength={120}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {error && <p className="text-sm text-primary">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
