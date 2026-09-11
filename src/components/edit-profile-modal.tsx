"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { checkUsernameAvailable, updateProfile } from "@/app/profile/actions";
import {
  ACCEPTED_PROFILE_MEDIA_ACCEPT,
  ACCEPTED_PROFILE_MEDIA_TYPES,
  MAX_PROFILE_MEDIA_BYTES,
  uploadProfileMedia,
} from "@/lib/profile-media";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const FIELD_LIMITS = {
  username: 20,
  displayName: 50,
  headline: 120,
  bio: 160,
  location: 30,
  website: 200,
} as const;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
type MediaKind = "avatar" | "banner";

export type ProfileDraft = {
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

function FieldBox({
  label,
  htmlFor,
  focused,
  length,
  max,
  children,
}: {
  label: string;
  htmlFor: string;
  focused: boolean;
  length: number;
  max: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-md border px-3 pb-1.5 pt-1.5 transition-colors ${
        focused ? "border-primary" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className={`text-xs leading-5 ${
            focused ? "text-primary" : "text-secondary"
          }`}
        >
          {label}
        </label>
        {focused && (
          <span className="text-xs leading-5 tabular-nums text-secondary">
            {length} / {max}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent text-[15px] leading-6 outline-none placeholder:text-secondary";

export function EditProfileModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProfileDraft;
  onClose: () => void;
  onSaved: (next: ProfileDraft) => void;
}) {
  const [username, setUsername] = useState(initial.username);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [website, setWebsite] = useState(initial.website);

  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<MediaKind, boolean>>({
    avatar: false,
    banner: false,
  });
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function handleUsernameChange(value: string) {
    const normalized = value.trim().toLowerCase();
    setUsername(value);

    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (normalized === initial.username.toLowerCase()) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(normalized)) {
      setUsernameStatus(value ? "invalid" : "idle");
      return;
    }

    setUsernameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      const result = await checkUsernameAvailable(normalized);
      setUsernameStatus(result.available ? "available" : "taken");
    }, 400);
  }

  function setPreview(kind: MediaKind, url: string | null) {
    if (kind === "avatar") setAvatarPreview(url);
    else setBannerPreview(url);
  }

  async function handleFile(kind: MediaKind, file: File | undefined) {
    if (!file) return;
    setMediaError(null);

    if (!(ACCEPTED_PROFILE_MEDIA_TYPES as readonly string[]).includes(file.type)) {
      setMediaError("That file type isn't supported. Use a JPEG, PNG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_PROFILE_MEDIA_BYTES) {
      setMediaError(
        `That image is too big — keep it under ${Math.round(
          MAX_PROFILE_MEDIA_BYTES / (1024 * 1024)
        )}MB.`
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    setPreview(kind, previewUrl);
    setUploading((prev) => ({ ...prev, [kind]: true }));

    const { url, error: uploadError } = await uploadProfileMedia(file, kind);

    setUploading((prev) => ({ ...prev, [kind]: false }));

    if (uploadError || !url) {
      setPreview(kind, null);
      setMediaError(uploadError ?? "That upload didn't go through — try again.");
      return;
    }

    if (kind === "avatar") setAvatarUrl(url);
    else setBannerUrl(url);
  }

  function handleRemove(kind: MediaKind) {
    setMediaError(null);
    setPreview(kind, null);
    // Submitting an empty avatar_url / banner_url is what clears the column
    // server-side; the Storage object is intentionally left behind.
    if (kind === "avatar") {
      setAvatarUrl(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    } else {
      setBannerUrl(null);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  const uploadPending = uploading.avatar || uploading.banner;
  const bannerSrc = bannerPreview ?? bannerUrl;
  const avatarSrc = avatarPreview ?? avatarUrl;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }

      onSaved({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatarUrl,
        bannerUrl,
      });
      onClose();
    });
  }

  return (
    <Modal
      title="Edit profile"
      onClose={onClose}
      headerAction={
        <button
          type="submit"
          form="edit-profile-form"
          disabled={
            pending ||
            uploadPending ||
            usernameStatus === "checking" ||
            usernameStatus === "taken" ||
            usernameStatus === "invalid"
          }
          className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      }
    >
      <form id="edit-profile-form" action={handleSubmit}>
        {/* Banner + overlapping avatar, bleeding to the modal's edges */}
        <div className="-mx-4 -mt-4">
          <div className="relative aspect-[3/1] w-full overflow-hidden bg-primary">
            {bannerSrc && (
              <Image
                src={bannerSrc}
                alt=""
                fill
                unoptimized
                sizes="512px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/45">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading.banner}
                aria-label="Add banner photo"
                title="Add banner photo"
                className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
              >
                <ImagePlus size={20} />
              </button>
              {bannerSrc && (
                <button
                  type="button"
                  onClick={() => handleRemove("banner")}
                  disabled={uploading.banner}
                  aria-label="Remove banner photo"
                  title="Remove banner photo"
                  className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {uploading.banner && (
              <div className="absolute inset-0 grid place-items-center bg-black/60">
                <LoaderCircle
                  size={26}
                  className="animate-spin text-white"
                  aria-label="Uploading banner photo"
                />
              </div>
            )}
          </div>

          <div className="px-4">
            <div className="relative -mt-12 h-24 w-24 overflow-hidden rounded-full bg-surface ring-4 ring-background">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt=""
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-primary/80" />
              )}
              <div className="absolute inset-0 grid place-items-center bg-black/45">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading.avatar}
                  aria-label="Add avatar photo"
                  title="Add avatar photo"
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
                >
                  <ImagePlus size={18} />
                </button>
              </div>
              {avatarSrc && !uploading.avatar && (
                <button
                  type="button"
                  onClick={() => handleRemove("avatar")}
                  aria-label="Remove avatar photo"
                  title="Remove avatar photo"
                  className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X size={13} />
                </button>
              )}
              {uploading.avatar && (
                <div className="absolute inset-0 grid place-items-center bg-black/60">
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-white"
                    aria-label="Uploading avatar photo"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {mediaError && (
          <p className="mt-3 text-sm text-primary" role="alert">
            {mediaError}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <FieldBox
              label="Username"
              htmlFor="profile-username"
              focused={focusedField === "username"}
              length={username.length}
              max={FIELD_LIMITS.username}
            >
              <div className="flex items-center">
                <span className="text-[15px] leading-6 text-secondary">@</span>
                <input
                  id="profile-username"
                  name="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="user1234"
                  pattern="[a-z0-9_]{3,20}"
                  title="Lowercase letters, numbers, and underscores only — 3 to 20 characters"
                  maxLength={FIELD_LIMITS.username}
                  required
                  className={`${inputClass} pl-0.5`}
                />
              </div>
            </FieldBox>
            <p
              className={`mt-1 px-1 text-xs ${
                usernameStatus === "taken" || usernameStatus === "invalid"
                  ? "text-primary"
                  : usernameStatus === "available"
                  ? "text-green-600"
                  : "text-secondary"
              }`}
            >
              {usernameStatus === "checking" && "Checking availability..."}
              {usernameStatus === "available" && "That username is free."}
              {usernameStatus === "taken" &&
                "Someone else already claimed that one."}
              {usernameStatus === "invalid" &&
                "Lowercase letters, numbers, underscores. 3–20 characters."}
              {usernameStatus === "idle" &&
                "Lowercase letters, numbers, underscores. 3–20 characters. Has to be unique — no two ghosts can share a name."}
            </p>
          </div>

          <FieldBox
            label="Name"
            htmlFor="profile-display-name"
            focused={focusedField === "display_name"}
            length={displayName.length}
            max={FIELD_LIMITS.displayName}
          >
            <input
              id="profile-display-name"
              name="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onFocus={() => setFocusedField("display_name")}
              onBlur={() => setFocusedField(null)}
              placeholder="Anonymous #42 (or don't, we're not your boss)"
              maxLength={FIELD_LIMITS.displayName}
              className={inputClass}
            />
          </FieldBox>

          <FieldBox
            label="Headline"
            htmlFor="profile-headline"
            focused={focusedField === "headline"}
            length={headline.length}
            max={FIELD_LIMITS.headline}
          >
            <input
              id="profile-headline"
              name="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              onFocus={() => setFocusedField("headline")}
              onBlur={() => setFocusedField(null)}
              placeholder="Senior Software Engineer @ [redacted] (send help)"
              maxLength={FIELD_LIMITS.headline}
              className={inputClass}
            />
          </FieldBox>

          <FieldBox
            label="Bio"
            htmlFor="profile-bio"
            focused={focusedField === "bio"}
            length={bio.length}
            max={FIELD_LIMITS.bio}
          >
            <textarea
              id="profile-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              placeholder="The short version of why you're like this."
              maxLength={FIELD_LIMITS.bio}
              rows={3}
              className={`${inputClass} h-[66px] resize-none`}
            />
          </FieldBox>

          <FieldBox
            label="Location"
            htmlFor="profile-location"
            focused={focusedField === "location"}
            length={location.length}
            max={FIELD_LIMITS.location}
          >
            <input
              id="profile-location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setFocusedField("location")}
              onBlur={() => setFocusedField(null)}
              placeholder="An open-plan office, sadly"
              maxLength={FIELD_LIMITS.location}
              className={inputClass}
            />
          </FieldBox>

          <FieldBox
            label="Website"
            htmlFor="profile-website"
            focused={focusedField === "website"}
            length={website.length}
            max={FIELD_LIMITS.website}
          >
            <input
              id="profile-website"
              name="website"
              type="url"
              inputMode="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onFocus={() => setFocusedField("website")}
              onBlur={() => setFocusedField(null)}
              placeholder="https://example.com"
              maxLength={FIELD_LIMITS.website}
              className={inputClass}
            />
          </FieldBox>
        </div>

        <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} />
        <input type="hidden" name="banner_url" value={bannerUrl ?? ""} />
        {/* Kept out of the tab order on purpose — the labelled round buttons
            over the banner/avatar are the keyboard-reachable triggers. */}
        <input
          ref={bannerInputRef}
          type="file"
          accept={ACCEPTED_PROFILE_MEDIA_ACCEPT}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => handleFile("banner", e.target.files?.[0])}
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept={ACCEPTED_PROFILE_MEDIA_ACCEPT}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => handleFile("avatar", e.target.files?.[0])}
        />

        {uploadPending && (
          <p className="mt-3 text-xs text-secondary">
            Uploading — hang on before saving.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-primary" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
