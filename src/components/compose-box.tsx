"use client";

import { useRef, useState, useTransition } from "react";
import { createPost } from "@/app/actions";
import { TAGS } from "@/lib/tags";

export function ComposeBox() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(formData: FormData) {
    selectedTags.forEach((tag) => formData.append("tags", tag));
    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSelectedTags([]);
      setAnonymous(false);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 mb-6">
      <form ref={formRef} action={handleSubmit}>
        <textarea
          name="body"
          rows={open ? 4 : 2}
          onFocus={() => setOpen(true)}
          placeholder="What corporate crime happened today?"
          className="w-full resize-none bg-transparent outline-none placeholder:text-secondary"
          maxLength={2000}
        />

        {open && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <input
                name="role"
                placeholder="Role (optional, e.g. AI Engineer)"
                className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
              />
              <input
                name="company"
                placeholder="Company (optional)"
                className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-secondary hover:border-primary"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-primary">{error}</p>}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="accent-primary"
                />
                {anonymous
                  ? "Posting anonymously"
                  : "Posting under your profile"}
              </label>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
              >
                {pending ? "Venting..." : "Vent"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
