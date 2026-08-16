import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import { CommentThread, type CommentItem } from "@/components/comment-thread";
import { POSTS_SELECT, mapPost } from "@/lib/posts";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: commentRows }, profileResult] = await Promise.all([
    supabase.from("posts").select(POSTS_SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("comments")
      .select(
        "id, body, created_at, profile_id, profiles!comments_profile_id_fkey(user_number, display_name)"
      )
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("profiles")
          .select("display_name, user_number")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (data) {
    await supabase.rpc("increment_post_views", { post_id: id });
  }

  const comments: CommentItem[] = (commentRows ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      profileId: row.profile_id,
      displayName: profile?.display_name ?? null,
      userNumber: profile?.user_number ?? 0,
    };
  });

  const viewerName = profileResult.data?.display_name || `Anonymous #${profileResult.data?.user_number ?? 0}`;

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to the feed
      </Link>

      {data ? (
        <>
          <PostCard {...mapPost(data, user?.id ?? null)} />
          <CommentThread
            postId={id}
            initialComments={comments}
            currentUserId={user?.id ?? null}
            avatarSeed={user?.id ?? null}
            avatarInitial={viewerName.trim().charAt(0).toUpperCase() || "A"}
            viewerDisplayName={profileResult.data?.display_name ?? null}
            viewerUserNumber={profileResult.data?.user_number ?? 0}
          />
        </>
      ) : (
        <p className="text-center text-secondary py-12">
          This confession is gone — deleted, or it never existed. The NDA
          wins this round.
        </p>
      )}
    </div>
  );
}
