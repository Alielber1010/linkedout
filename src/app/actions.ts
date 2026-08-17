"use server";

import { revalidatePath } from "next/cache";
import { checkBotId } from "botid/server";
import { createClient } from "@/lib/supabase/server";
import { extractTags, type ReactionType } from "@/lib/tags";
import { PAGE_SIZE, POSTS_SELECT, mapPost } from "@/lib/posts";

// Fail OPEN: if BotID's own detection call throws (misconfigured project,
// verification endpoint unreachable, etc.) we'd otherwise crash the whole
// server action and block real users from posting at all. A false negative
// (an undetected bot slips through) is a much smaller problem than every
// signed-in user losing the ability to post.
async function isLikelyBot() {
  try {
    const { isBot } = await checkBotId();
    return isBot;
  } catch (err) {
    console.error("checkBotId failed, allowing request through:", err);
    return false;
  }
}

// Shared spam guard for anything a user can post repeatedly (posts, comments):
// a short cooldown between writes plus a coarse hourly cap. Not a substitute
// for checkBotId — this only slows down volume once a caller is already past
// the bot check.
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "posts" | "comments",
  profileId: string
) {
  const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
  const { count: recentCount } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .gte("created_at", tenSecondsAgo);

  if ((recentCount ?? 0) > 0) {
    return "Slow down — wait a few seconds and try again.";
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .gte("created_at", oneHourAgo);

  if ((hourlyCount ?? 0) >= 30) {
    return "You've hit the hourly limit. Try again later.";
  }

  return null;
}

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const tags = extractTags(body);
  const isAnonymous = formData.get("anonymous") === "on";
  const quotedPostId = formData.get("quoted_post_id");

  if (!body) return { error: "Say something first." };

  if (await isLikelyBot()) return { error: "Automated request blocked." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const rateLimitError = await checkRateLimit(supabase, "posts", user.id);
  if (rateLimitError) return { error: rateLimitError };

  const { error } = await supabase.from("posts").insert({
    profile_id: user.id,
    body,
    tags,
    is_anonymous: isAnonymous,
    quoted_post_id: quotedPostId ? String(quotedPostId) : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/search");
  return { error: null };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/search");
  return { error: null };
}

export async function loadMorePosts(cursor: string, tag?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(POSTS_SELECT)
    .order("created_at", { ascending: false })
    .lt("created_at", cursor)
    .limit(PAGE_SIZE);

  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  if (error) return { error: error.message, posts: [] };

  return {
    error: null,
    posts: (data ?? []).map((post) => mapPost(post, user?.id ?? null)),
  };
}

// Polled from the client to power the "N new confessions" banner — deliberately
// not pushed via revalidatePath, since other people's posts landing mid-scroll
// should never silently reshuffle what's on screen.
export async function loadNewerPosts(cursor: string, tag?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(POSTS_SELECT)
    .order("created_at", { ascending: false })
    .gt("created_at", cursor)
    .limit(PAGE_SIZE);

  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  if (error) return { error: error.message, posts: [] };

  return {
    error: null,
    posts: (data ?? []).map((post) => mapPost(post, user?.id ?? null)),
  };
}

export async function react(postId: string, reactionType: ReactionType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  // toggle_reaction does the read-then-write atomically in one DB
  // transaction (RPC), so rapid repeated clicks can't race each other
  // into an inconsistent state the way a separate select-then-branch
  // from the client could.
  const { error } = await supabase.rpc("toggle_reaction", {
    p_post_id: postId,
    p_reaction_type: reactionType,
  });
  if (error) return { error: error.message };

  return { error: null };
}

export async function toggleRepost(postId: string) {
  if (await isLikelyBot()) return { error: "Automated request blocked." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  // Atomic read-then-write via RPC — same rapid-click race the reaction
  // toggle had (see toggle_reaction).
  const { error } = await supabase.rpc("toggle_repost", { p_post_id: postId });
  if (error) return { error: error.message };

  return { error: null };
}

export async function createComment(postId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Say something first." };

  if (await isLikelyBot()) return { error: "Automated request blocked." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const rateLimitError = await checkRateLimit(supabase, "comments", user.id);
  if (rateLimitError) return { error: rateLimitError };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    profile_id: user.id,
    body,
  });

  if (error) return { error: error.message };

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  revalidatePath("/search");
  return { error: null };
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  revalidatePath("/search");
  return { error: null };
}
