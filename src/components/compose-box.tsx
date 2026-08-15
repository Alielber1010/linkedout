"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { createPost } from "@/app/actions";
import { TAGS, extractTags } from "@/lib/tags";
import { EMPTY_REACTION_COUNTS, type MappedPost } from "@/lib/posts";
import { Avatar } from "@/components/avatar";

const MAX_SUGGESTIONS = 6;

function activeHashtagQuery(text: string, caret: number) {
  const upToCaret = text.slice(0, caret);
  const match = upToCaret.match(/#(\w*)$/);
  return match ? match[1] : null;
}

export function ComposeBox({
  defaultAnonymous = false,
  avatarSeed,
  avatarInitial,
  profileId,
  displayName,
  headline,
  userNumber,
  onOptimisticPost,
  onOptimisticPostFailed,
}: {
  defaultAnonymous?: boolean;
  avatarSeed: string;
  avatarInitial: string;
  profileId: string;
  displayName: string | null;
  headline: string | null;
  userNumber: number;
  onOptimisticPost?: (post: MappedPost) => void;
  onOptimisticPostFailed?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(defaultAnonymous);
  const [bodyLength, setBodyLength] = useState(0);
  const [hashtagQuery, setHashtagQuery] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions =
    hashtagQuery === null
      ? []
      : TAGS.filter((tag) =>
          tag.toLowerCase().startsWith(hashtagQuery.toLowerCase())
        ).slice(0, MAX_SUGGESTIONS);

  useEffect(() => {
    function focusIfRequested() {
      if (window.location.hash === "#compose") {
        setOpen(true);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }
    focusIfRequested();
    window.addEventListener("hashchange", focusIfRequested);
    return () => window.removeEventListener("hashchange", focusIfRequested);
  }, []);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBodyLength(e.target.value.length);
    setHashtagQuery(activeHashtagQuery(e.target.value, e.target.selectionStart));
    setActiveSuggestion(0);
  }

  function insertTag(tag: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const caret = textarea.selectionStart;
    const text = textarea.value;
    const upToCaret = text.slice(0, caret);
    const start = upToCaret.search(/#\w*$/);
    if (start === -1) return;

    const before = text.slice(0, start);
    const after = text.slice(caret);
    const nextText = `${before}#${tag} ${after}`;
    const nextCaret = before.length + tag.length + 2;

    textarea.value = nextText;
    textarea.setSelectionRange(nextCaret, nextCaret);
    textarea.focus();
    setBodyLength(nextText.length);
    setHashtagQuery(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertTag(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setHashtagQuery(null);
    }
  }

  function handleSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    const role = String(formData.get("role") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const isAnonymous = formData.get("anonymous") === "on";
    const tempId = `optimistic-${crypto.randomUUID()}`;

    // <form action={fn}> implicitly runs fn inside a transition (that's how
    // useFormStatus's pending state works), which defers any state updates
    // triggered here until the transition settles — including the *later*
    // explicit startTransition below for the actual network call. flushSync
    // forces this specific update out immediately so the post actually shows
    // up the instant you hit submit instead of only after the round trip.
    flushSync(() => {
      onOptimisticPost?.({
        id: tempId,
        profileId,
        body,
        role: role || null,
        company: company || null,
        tags: extractTags(body),
        createdAt: new Date().toISOString(),
        userNumber,
        displayName,
        headline,
        isAnonymous,
        counts: { ...EMPTY_REACTION_COUNTS },
        mine: null,
        isOwner: true,
      });
      setError(null);
      setAnonymous(defaultAnonymous);
      setBodyLength(0);
      setHashtagQuery(null);
      setOpen(false);
    });
    formRef.current?.reset();

    startTransition(async () => {
      try {
        const result = await createPost(formData);
        if (result?.error) throw new Error(result.error);
      } catch (err) {
        onOptimisticPostFailed?.(tempId);
        setError(err instanceof Error ? err.message : "Post didn't save — try again.");
      }
    });
  }

  return (
    <div
      id="compose"
      className="rounded-xl border border-border bg-surface px-4 py-3 mb-6 scroll-mt-20"
    >
      <form ref={formRef} action={handleSubmit}>
        <div className="flex gap-3">
          <Avatar seed={avatarSeed} content={avatarInitial} size={40} />

          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              name="body"
              rows={open ? 3 : 1}
              onFocus={() => setOpen(true)}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onBlur={() =>
                setTimeout(() => setHashtagQuery(null), 150)
              }
              placeholder="What corporate crime happened today?"
              className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-secondary"
              maxLength={2000}
            />

            {!open && error && (
              <p className="mt-1 text-sm text-primary">{error}</p>
            )}

            {suggestions.length > 0 && (
              <div className="relative">
                <div className="absolute z-10 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                  {suggestions.map((tag, i) => (
                    <button
                      type="button"
                      key={tag}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertTag(tag)}
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                        i === activeSuggestion
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-background"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

                <p className="text-xs text-secondary">
                  Type <span className="text-primary">#</span> to tag it —
                  #Layoffs, #ToxicBoss, you know the drill.
                </p>

                {error && <p className="text-sm text-primary">{error}</p>}

                <div className="flex items-center justify-between border-t border-border pt-3">
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
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs tabular-nums ${
                        bodyLength > 1800 ? "text-primary" : "text-secondary"
                      }`}
                      aria-live="polite"
                    >
                      {bodyLength}/2000
                    </span>
                    <button
                      type="submit"
                      disabled={pending || bodyLength === 0}
                      className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
                    >
                      {pending ? "Venting..." : "Vent"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
