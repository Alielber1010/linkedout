"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Eye,
  MessageCircle,
  Repeat2,
  Share,
  Trash2,
} from "lucide-react";
import { ReactionBar } from "@/components/reaction-bar";
import { RepostButton } from "@/components/repost-button";
import { Avatar } from "@/components/avatar";
import { deletePost } from "@/app/actions";
import { canonicalTag, type ReactionType } from "@/lib/tags";
import { timeAgo } from "@/lib/time";
import type { QuotedPost } from "@/lib/posts";

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

function formatActionCount(count: number) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(".0", "")}K`;
  }
  return count > 0 ? String(count) : "";
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
  quotedPost,
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
  quotedPost?: QuotedPost | null;
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

          {quotedPost && (
            <Link
              href={`/post/${quotedPost.id}`}
              className="mt-3 block rounded-xl border border-border p-3 hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <Avatar content="" size={20} muted={quotedPost.isAnonymous} />
                <span className="font-semibold">
                  {!quotedPost.isAnonymous && quotedPost.displayName
                    ? quotedPost.displayName
                    : `Anonymous #${quotedPost.userNumber}`}
                </span>
                {!quotedPost.isAnonymous && quotedPost.username && (
                  <span className="text-xs text-secondary">@{quotedPost.username}</span>
                )}
                <span className="text-xs text-secondary ml-auto">
                  {timeAgo(quotedPost.createdAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-secondary">
                {quotedPost.body}
              </p>
            </Link>
          )}

          <div
            className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px_36px] items-center gap-1 text-secondary"
            aria-label={`${commentCount} comments, ${repostCount} reposts, ${views} views`}
          >
            {isOptimistic ? (
              <span className="group flex h-9 min-w-0 items-center gap-1.5 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full">
                  <MessageCircle size={18} />
                </span>
                <span className="min-w-0 tabular-nums">
                  {formatActionCount(commentCount)}
                </span>
              </span>
            ) : (
              <Link
                href={`/post/${id}#comments`}
                className="group flex h-9 min-w-0 items-center gap-1.5 text-sm transition-colors hover:text-sky-500"
                aria-label={`${commentCount} comments`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors group-hover:bg-sky-500/10">
                  <MessageCircle size={18} />
                </span>
                <span className="min-w-0 tabular-nums">
                  {formatActionCount(commentCount)}
                </span>
              </Link>
            )}

            {isOptimistic ? (
              <span className="group flex h-9 min-w-0 items-center gap-1.5 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full">
                  <Repeat2 size={18} />
                </span>
                <span className="min-w-0 tabular-nums">
                  {formatActionCount(repostCount)}
                </span>
              </span>
            ) : (
              <RepostButton
                postId={id}
                count={repostCount}
                mine={repostedByMe}
                quotedBody={body}
                quotedIdentity={identity}
                quotedIsAnonymous={isAnonymous}
                quotedCreatedAt={createdAt}
              />
            )}

            <ReactionBar postId={id} counts={counts} mine={mine} />

            <span
              className="group flex h-9 min-w-0 items-center gap-1.5 text-sm"
              aria-label={`${views} views`}
              title="Views"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full">
                <Eye size={18} />
              </span>
              <span className="min-w-0 tabular-nums">
                {formatActionCount(views)}
              </span>
            </span>

            <button
              type="button"
              aria-label="Bookmark"
              title="Bookmark"
              className="group grid h-9 w-9 place-items-center justify-self-end rounded-full transition-colors hover:bg-sky-500/10 hover:text-sky-500"
            >
              <Bookmark size={18} />
            </button>

            {!isOptimistic ? (
              <button
                type="button"
                onClick={handleShare}
                aria-label="Copy link to confession"
                title={copied ? "Copied" : "Share"}
                className="group grid h-9 w-9 place-items-center justify-self-end rounded-full transition-colors hover:bg-sky-500/10 hover:text-sky-500"
              >
                {copied ? <Check size={18} /> : <Share size={18} />}
              </button>
            ) : (
              <span className="h-9 w-9" aria-hidden />
            )}
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
