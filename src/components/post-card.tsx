"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Link2, Check, MessageCircle, Eye, Repeat2 } from "lucide-react";
import { ReactionBar } from "@/components/reaction-bar";
import { RepostButton } from "@/components/repost-button";
import { Avatar } from "@/components/avatar";
import { deletePost } from "@/app/actions";
import { canonicalTag, type ReactionType } from "@/lib/tags";
import { timeAgo } from "@/lib/time";

function renderBody(body: string) {
  const parts = body.split(/(#\w+)/g);
  return parts.map((part, i) => {
    const match = part.match(/^#(\w+)$/);
    const tag = match ? canonicalTag(match[1]) : undefined;
    if (tag) {
      return (
        <Link
          key={i}
          href={`/?tag=${encodeURIComponent(tag)}`}
          className="text-primary hover:underline"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function PostCard({
  id,
  profileId,
  body,
  createdAt,
  userNumber,
  displayName,
  headline,
  username,
  isAnonymous,
  counts,
  mine,
  isOwner,
  views,
  commentCount,
  repostCount,
  repostedByMe,
  onDeleted,
}: {
  id: string;
  profileId: string;
  body: string;
  createdAt: string;
  userNumber: number;
  displayName: string | null;
  headline: string | null;
  username: string | null;
  isAnonymous: boolean;
  counts: Record<ReactionType, number>;
  mine: ReactionType | null;
  isOwner: boolean;
  views: number;
  commentCount: number;
  repostCount: number;
  repostedByMe: boolean;
  onDeleted?: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [copied, setCopied] = useState(false);

  const identity =
    !isAnonymous && displayName ? displayName : `Anonymous #${userNumber}`;
  const isOptimistic = id.startsWith("optimistic-");

  function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDelete() {
    // Not persisted yet (still mid-flight optimistic insert) — nothing to
    // delete server-side, just drop it locally.
    if (id.startsWith("optimistic-")) {
      setRemoved(true);
      onDeleted?.(id);
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      try {
        const result = await deletePost(id);
        if (result?.error) throw new Error(result.error);
        setRemoved(true);
        onDeleted?.(id);
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : "Delete didn't go through — try again."
        );
      }
    });
  }

  if (removed) return null;

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        <Avatar
          seed={isAnonymous ? identity : profileId}
          content={isAnonymous ? "\u{1F47B}" : identity.charAt(0).toUpperCase()}
          muted={isAnonymous}
          size={44}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-semibold">{identity}</span>
            {!isAnonymous && username && (
              <span className="text-xs text-secondary">@{username}</span>
            )}
            {!isAnonymous && headline && (
              <span className="text-xs text-secondary">{headline}</span>
            )}
            {isOptimistic ? (
              <span className="text-secondary text-xs ml-auto">
                {timeAgo(createdAt)}
              </span>
            ) : (
              <Link
                href={`/post/${id}`}
                className="text-secondary text-xs ml-auto hover:text-primary hover:underline"
              >
                {timeAgo(createdAt)}
              </Link>
            )}
            {!isOptimistic && (
              <button
                type="button"
                onClick={handleShare}
                aria-label="Copy link to confession"
                title="Copy link"
                className="text-secondary hover:text-primary transition-colors"
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => setConfirming((v) => !v)}
                aria-label="Delete confession"
                title="Delete"
                className="text-secondary hover:text-primary transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <p className="mt-2 whitespace-pre-wrap leading-relaxed">
            {renderBody(body)}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            {isOptimistic ? (
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-secondary">
                <MessageCircle size={16} />
                {commentCount > 0 ? commentCount : ""}
              </span>
            ) : (
              <Link
                href={`/post/${id}#comments`}
                className="flex shrink-0 items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                aria-label={`${commentCount} comments`}
              >
                <MessageCircle size={16} />
                {commentCount > 0 ? commentCount : ""}
              </Link>
            )}

            {isOptimistic ? (
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-secondary">
                <Repeat2 size={18} />
                {repostCount > 0 ? repostCount : ""}
              </span>
            ) : (
              <RepostButton postId={id} count={repostCount} mine={repostedByMe} />
            )}

            <div className="min-w-0 overflow-x-auto">
              <ReactionBar postId={id} counts={counts} mine={mine} />
            </div>

            <span
              className="flex shrink-0 items-center gap-1.5 text-sm text-secondary"
              aria-label={`${views} views`}
              title="Views"
            >
              <Eye size={16} />
              {views}
            </span>
          </div>

          {confirming && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
              <span>Delete this confession? This can&apos;t be undone.</span>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                >
                  {pending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
          {deleteError && (
            <p className="mt-2 text-sm text-primary">{deleteError}</p>
          )}
        </div>
      </div>
    </article>
  );
}
