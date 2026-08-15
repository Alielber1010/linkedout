"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/post-card";
import { loadMorePosts } from "@/app/actions";
import { PAGE_SIZE, type MappedPost } from "@/lib/posts";

export function Feed({
  initialPosts,
  tag,
  hasMoreInitially,
  emptyMessage,
}: {
  initialPosts: MappedPost[];
  tag?: string;
  hasMoreInitially: boolean;
  emptyMessage: string;
}) {
  const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(hasMoreInitially);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // `initialPosts` is a fresh fetch of page one every time the parent Server
  // Component re-renders (new post, reaction, delete all call revalidatePath).
  // Re-seed from it so those changes actually show up, but keep any extra
  // pages the user already pulled in via "Load more" instead of discarding
  // them on every unrelated revalidation. Done during render (React's
  // documented pattern for deriving state from a changed prop) rather than
  // in an effect, so it settles in the same commit instead of a follow-up one.
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

  function handleLoadMore() {
    const cursor = posts[posts.length - 1]?.createdAt;
    if (!cursor) return;
    setError(null);
    startTransition(async () => {
      const result = await loadMorePosts(cursor, tag);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPosts((prev) => [...prev, ...result.posts]);
      setHasMore(result.posts.length === PAGE_SIZE);
    });
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (posts.length === 0) {
    return <p className="text-center text-secondary py-12">{emptyMessage}</p>;
  }

  return (
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
  );
}
