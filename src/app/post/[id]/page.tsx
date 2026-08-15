import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
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

  const { data } = await supabase
    .from("posts")
    .select(POSTS_SELECT)
    .eq("id", id)
    .maybeSingle();

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
        <PostCard {...mapPost(data, user?.id ?? null)} />
      ) : (
        <p className="text-center text-secondary py-12">
          This confession is gone — deleted, or it never existed. The NDA
          wins this round.
        </p>
      )}
    </div>
  );
}
