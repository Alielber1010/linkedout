"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/lib/tags";

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const tags = formData.getAll("tags").map(String);
  const isAnonymous = formData.get("anonymous") === "on";

  if (!body) return { error: "Say something first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const { error } = await supabase.from("posts").insert({
    profile_id: user.id,
    body,
    role: role || null,
    company: company || null,
    tags,
    is_anonymous: isAnonymous,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}

export async function react(postId: string, reactionType: ReactionType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in yet, refresh and try again." };

  const { data: existing } = await supabase
    .from("reactions")
    .select("reaction_type")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing?.reaction_type === reactionType) {
    await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
  } else {
    await supabase.from("reactions").upsert({
      post_id: postId,
      profile_id: user.id,
      reaction_type: reactionType,
    });
  }

  revalidatePath("/");
  return { error: null };
}
