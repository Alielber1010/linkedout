"use client";

import { useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { Trash2 } from "lucide-react";
import { createComment, deleteComment } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/time";

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  profileId: string;
  displayName: string | null;
  userNumber: number;
};

export function CommentThread({
  postId,
  initialComments,
  currentUserId,
  avatarSeed,
  avatarInitial,
  viewerDisplayName,
  viewerUserNumber,
}: {
  postId: string;
  initialComments: CommentItem[];
  currentUserId: string | null;
  avatarSeed: string | null;
  avatarInitial: string | null;
  viewerDisplayName: string | null;
  viewerUserNumber: number;
}) {
  const [prevInitial, setPrevInitial] = useState(initialComments);
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-seed from a fresh server fetch (revalidatePath after post/delete)
  // without clobbering an in-flight optimistic add — same pattern feed.tsx
  // uses for posts.
  if (initialComments !== prevInitial) {
    setPrevInitial(initialComments);
    setComments(initialComments);
  }

  function handleSubmit(formData: FormData) {
    const text = String(formData.get("body") ?? "").trim();
    if (!text) return;

    const tempId = `optimistic-${crypto.randomUUID()}`;

    flushSync(() => {
      if (currentUserId) {
        setComments((prev) => [
          ...prev,
          {
            id: tempId,
            body: text,
            createdAt: new Date().toISOString(),
            profileId: currentUserId,
            displayName: viewerDisplayName,
            userNumber: viewerUserNumber,
          },
        ]);
      }
      setError(null);
      setBody("");
    });

    startTransition(async () => {
      try {
        const result = await createComment(postId, formData);
        if (result?.error) throw new Error(result.error);
      } catch (err) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setError(err instanceof Error ? err.message : "Comment didn't save — try again.");
      }
    });
  }

  function handleDelete(commentId: string) {
    if (commentId.startsWith("optimistic-")) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startTransition(async () => {
      const result = await deleteComment(commentId, postId);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div id="comments" className="space-y-4 scroll-mt-20">
      {currentUserId && (
        <form
          action={handleSubmit}
          className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <Avatar seed={avatarSeed ?? currentUserId} content={avatarInitial ?? "A"} size={32} />
          <div className="min-w-0 flex-1">
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Reply..."
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-secondary"
            />
            <div className="mt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={pending || body.trim().length === 0}
                className="rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50"
              >
                {pending ? "Replying..." : "Reply"}
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-primary">{error}</p>}

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const identity = comment.displayName || `Anonymous #${comment.userNumber}`;
            const isOwner = currentUserId != null && comment.profileId === currentUserId;
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar seed={comment.profileId} content={identity.charAt(0).toUpperCase()} size={32} />
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{identity}</span>
                    <span className="text-secondary">{timeAgo(comment.createdAt)}</span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        aria-label="Delete comment"
                        title="Delete"
                        className="ml-auto text-secondary hover:text-primary transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
