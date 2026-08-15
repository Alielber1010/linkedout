"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PostCard } from "@/components/post-card";
import { ComposeBox } from "@/components/compose-box";
import { loadMorePosts, loadNewerPosts } from "@/app/actions";
import { PAGE_SIZE, type MappedPost } from "@/lib/posts";

const POLL_INTERVAL_MS = 20000;

type ComposerConfig = {
  defaultAnonymous: boolean;
  avatarSeed: string;
  avatarInitial: string;
  profileId: string;
  displayName: string | null;
  headline: string | null;
  userNumber: number;
};

export function Feed({
  initialPosts,
  tag,
  hasMoreInitially,
  emptyMessage,
  composer,
}: {
  initialPosts: MappedPost[];
  tag?: string;
  hasMoreInitially: boolean;
  emptyMessage: string;
  composer?: ComposerConfig;
}) {
  const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(hasMoreInitially);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingNewPosts, setPendingNewPosts] = useState<MappedPost[]>([]);
  const postsRef = useRef(posts);

  // `initialPosts` is a fresh fetch of page one every time the parent Server
  // Component re-renders (new post, delete both call revalidatePath). Re-seed
  // from it so those changes actually show up, but keep any extra pages the
  // user already pulled in via "Load more" instead of discarding them on
  // every unrelated revalidation. Done during render (React's documented
  // pattern for deriving state from a changed prop) rather than in an
  // effect, so it settles in the same commit instead of a follow-up one.
  if (initialPosts !== prevInitialPosts) {
    setPrevInitialPosts(initialPosts);
    const cutoff = initialPosts[initialPosts.length - 1]?.createdAt;
    const initialIds = new Set(initialPosts.map((p) => p.id));
    const extra = cutoff
      ? posts.filter((p) => p.createdAt < cutoff && !initialIds.has(p.id))
      : [];
    setPosts([...initialPosts, ...extra]);
    setHasMore(hasMoreInitially);
  }

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Other people's posts don't push to us (no realtime subscription) — poll
  // lightly and surface a "N new confessions" banner instead of silently
  // injecting content, which would yank the reader's scroll position.
  useEffect(() => {
    const interval = setInterval(async () => {
      const top = postsRef.current[0]?.createdAt;
      if (!top) return;
      try {
        const result = await loadNewerPosts(top, tag);
        if (!result.error) setPendingNewPosts(result.posts);
      } catch {
        // transient — next poll will retry
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tag]);

  function handleLoadMore() {
    const cursor = posts[posts.length - 1]?.createdAt;
    if (!cursor) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await loadMorePosts(cursor, tag);
        if (result.error) throw new Error(result.error);
        setPosts((prev) => [...prev, ...result.posts]);
        setHasMore(result.posts.length === PAGE_SIZE);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load more — try again.");
      }
    });
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleOptimisticPost(post: MappedPost) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleOptimisticPostFailed(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function showNewPosts() {
    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const fresh = pendingNewPosts.filter((p) => !existingIds.has(p.id));
      return [...fresh, ...prev];
    });
    setPendingNewPosts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {composer && (
        <ComposeBox
          defaultAnonymous={composer.defaultAnonymous}
          avatarSeed={composer.avatarSeed}
          avatarInitial={composer.avatarInitial}
          profileId={composer.profileId}
          displayName={composer.displayName}
          headline={composer.headline}
          userNumber={composer.userNumber}
          onOptimisticPost={handleOptimisticPost}
          onOptimisticPostFailed={handleOptimisticPostFailed}
        />
      )}

      {pendingNewPosts.length > 0 && (
        <button
          type="button"
          onClick={showNewPosts}
          className="mb-4 block w-full rounded-full border border-primary bg-primary/5 px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          {pendingNewPosts.length === 1
            ? "1 new confession — show"
            : `${pendingNewPosts.length} new confessions — show`}
        </button>
      )}

      {posts.length === 0 ? (
        <p className="text-center text-secondary py-12">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} onDeleted={handleDeleted} />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={pending}
                className="rounded-full border border-border px-4 py-2 text-sm text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {pending ? "Loading..." : "Load more confessions"}
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-primary">{error}</p>}
        </div>
      )}
    </div>
  );
}
