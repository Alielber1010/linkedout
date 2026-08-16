"use client";

import { useState } from "react";
import { PostCard } from "@/components/post-card";
import type { MappedPost } from "@/lib/posts";

export function ProfilePosts({ initialPosts }: { initialPosts: MappedPost[] }) {
  const [posts, setPosts] = useState(initialPosts);

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (posts.length === 0) {
    return (
      <p className="text-center text-secondary py-8 text-sm">
        No confessions posted yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
