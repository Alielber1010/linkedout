import { createClient } from "@/lib/supabase/client";

/**
 * Profile avatar/banner uploads.
 *
 * These go straight from the browser to Supabase Storage — NOT through a
 * Server Action. Next caps Server Action request bodies at 1MB by default,
 * so a 5MB photo would fail there. The action only ever receives the
 * resulting public URL (and re-validates that it points at this bucket).
 *
 * Objects must live under `<user-id>/...` — that's what the storage RLS
 * policies check, so the path convention below is load-bearing, not cosmetic.
 */

export const PROFILE_MEDIA_BUCKET = "profile-media";

/** 5MB — matches the bucket's file_size_limit. */
export const MAX_PROFILE_MEDIA_BYTES = 5 * 1024 * 1024;

/** Matches the bucket's allowed_mime_types. */
export const ACCEPTED_PROFILE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ProfileMediaType = (typeof ACCEPTED_PROFILE_MEDIA_TYPES)[number];

export type ProfileMediaKind = "avatar" | "banner";

/** Ready to drop into <input type="file" accept={...} />. */
export const ACCEPTED_PROFILE_MEDIA_ACCEPT = ACCEPTED_PROFILE_MEDIA_TYPES.join(",");

const EXTENSION_BY_TYPE: Record<ProfileMediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function isAcceptedType(type: string): type is ProfileMediaType {
  return (ACCEPTED_PROFILE_MEDIA_TYPES as readonly string[]).includes(type);
}

export async function uploadProfileMedia(
  file: File,
  kind: ProfileMediaKind
): Promise<{ url: string | null; error: string | null }> {
  if (!isAcceptedType(file.type)) {
    return { url: null, error: "That file type isn't supported — use a JPEG, PNG, WebP or GIF." };
  }

  if (file.size > MAX_PROFILE_MEDIA_BYTES) {
    return { url: null, error: "That image is over 5MB. Try a smaller one." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Not signed in." };

  // <user-id>/<kind>-<timestamp>.<ext> — the leading folder is what storage RLS
  // matches against auth.uid(); the timestamp keeps uploads collision-free so
  // upsert:false never has to overwrite (and busts any CDN cache on change).
  const path = `${user.id}/${kind}-${Date.now()}.${EXTENSION_BY_TYPE[file.type]}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(path, file, { upsert: false, cacheControl: "3600", contentType: file.type });

  if (uploadError) {
    return { url: null, error: uploadError.message || "Couldn't upload that image." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(path);

  if (!publicUrl) return { url: null, error: "Uploaded, but couldn't read the image URL back." };

  return { url: publicUrl, error: null };
}
