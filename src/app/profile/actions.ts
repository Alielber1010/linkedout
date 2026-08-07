"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["left", "fired", "laid_off", "escaped", "ghosted"] as const;
export type CompanyStatus = (typeof STATUSES)[number];

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();

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
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { error: null };
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
