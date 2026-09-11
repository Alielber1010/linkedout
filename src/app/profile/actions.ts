"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_MEDIA_BUCKET, type ProfileMediaKind } from "@/lib/profile-media";

const STATUSES = ["left", "fired", "laid_off", "escaped", "ghosted"] as const;
export type CompanyStatus = (typeof STATUSES)[number];

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// Mirrors the DB check constraints added in 20260817182820 — enforced here too
// so the user gets a friendly message instead of a raw Postgres 23514.
const MAX_BIO = 160;
const MAX_LOCATION = 30;
const MAX_WEBSITE = 200;

// Only URLs served by our own Storage bucket are accepted for avatar/banner.
// The browser uploads directly to Storage and posts back the resulting public
// URL, so without this the field would be an open redirect to any host.
const PROFILE_MEDIA_URL_PREFIX = `${process.env
  .NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/`;

/**
 * Absent field  -> undefined (column left untouched)
 * Empty string  -> null      (column cleared)
 * Otherwise     -> trimmed value
 */
function optionalText(formData: FormData, key: string): string | null | undefined {
  if (!formData.has(key)) return undefined;
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function normalizeWebsite(raw: string): { url: string | null; error: string | null } {
  const value = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { url: null, error: "That doesn't look like a link." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url: null, error: "That doesn't look like a link." };
  }
  if (!parsed.hostname.includes(".")) {
    return { url: null, error: "That doesn't look like a link." };
  }
  if (value.length > MAX_WEBSITE) {
    return { url: null, error: `Website link has to be ${MAX_WEBSITE} characters or fewer.` };
  }

  return { url: value, error: null };
}

function validateMediaUrl(
  value: string | null | undefined,
  label: string
): { url: string | null | undefined; error: string | null } {
  if (value === undefined || value === null) return { url: value, error: null };
  if (!value.startsWith(PROFILE_MEDIA_URL_PREFIX)) {
    return { url: null, error: `That ${label} image didn't come from an upload here.` };
  }
  return { url: value, error: null };
}

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username needs to be 3-20 characters: lowercase letters, numbers, underscores only.",
    };
  }

  const bio = optionalText(formData, "bio");
  if (bio && bio.length > MAX_BIO) {
    return { error: `Bio has to be ${MAX_BIO} characters or fewer.` };
  }

  const location = optionalText(formData, "location");
  if (location && location.length > MAX_LOCATION) {
    return { error: `Location has to be ${MAX_LOCATION} characters or fewer.` };
  }

  const rawWebsite = optionalText(formData, "website");
  let website: string | null | undefined = rawWebsite;
  if (rawWebsite) {
    const normalized = normalizeWebsite(rawWebsite);
    if (normalized.error) return { error: normalized.error };
    website = normalized.url;
  }

  const avatar = validateMediaUrl(optionalText(formData, "avatar_url"), "profile");
  if (avatar.error) return { error: avatar.error };

  const banner = validateMediaUrl(optionalText(formData, "banner_url"), "header");
  if (banner.error) return { error: banner.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const patch: Record<string, string | null> = {
    display_name: displayName || null,
    headline: headline || null,
    username,
  };
  if (bio !== undefined) patch.bio = bio;
  if (location !== undefined) patch.location = location;
  if (website !== undefined) patch.website = website;
  if (avatar.url !== undefined) patch.avatar_url = avatar.url;
  if (banner.url !== undefined) patch.banner_url = banner.url;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);

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

/**
 * Clears avatar_url / banner_url ("remove photo" in the edit modal).
 * Only nulls the column — the object is left in Storage, which is cheap and
 * keeps this from being a way to nuke files a stale tab still references.
 */
export async function removeProfileMedia(kind: ProfileMediaKind) {
  if (kind !== "avatar" && kind !== "banner") return { error: "Unknown photo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const column = kind === "avatar" ? "avatar_url" : "banner_url";
  const { error } = await supabase
    .from("profiles")
    .update({ [column]: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

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
