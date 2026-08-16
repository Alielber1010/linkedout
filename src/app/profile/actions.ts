"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["left", "fired", "laid_off", "escaped", "ghosted"] as const;
export type CompanyStatus = (typeof STATUSES)[number];

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username needs to be 3-20 characters: lowercase letters, numbers, underscores only.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      headline: headline || null,
      username,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username's taken — someone else already claimed it." };
    }
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { error: null };
}

export async function checkUsernameAvailable(rawUsername: string) {
  const username = rawUsername.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) return { available: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) return { available: false };
  return { available: !data || data.id === user?.id };
}

export async function addCompany(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  if (!company) return { error: "Company name can't be empty." };
  if (!STATUSES.includes(status as CompanyStatus)) {
    return { error: "Pick a valid status." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profile_companies").insert({
    profile_id: user.id,
    company,
    status,
  });

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { error: null };
}

export async function removeCompany(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profile_companies")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { error: null };
}
