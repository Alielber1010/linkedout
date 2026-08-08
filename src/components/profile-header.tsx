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
}: {
  initial: string;
  userNumber?: number;
  createdAt: string | null;
  initialDisplayName: string;
  initialHeadline: string;
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [headline, setHeadline] = useState(initialHeadline);
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

      <h1 className="mt-3 text-xl font-bold">{shownName}</h1>
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
