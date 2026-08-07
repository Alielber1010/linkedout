"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/profile/actions";

export function ProfileForm({
  initialDisplayName,
  initialHeadline,
}: {
  initialDisplayName: string;
  initialHeadline: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">
          Display name
        </label>
        <input
          name="display_name"
          defaultValue={initialDisplayName}
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
          defaultValue={initialHeadline}
          placeholder="Senior Software Engineer @ [redacted] (send help)"
          maxLength={120}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-secondary">Saved. Nobody&apos;s proud.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
