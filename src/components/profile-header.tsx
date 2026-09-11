"use client";

import { useState } from "react";
import Image from "next/image";
import { Link as LinkIcon, MapPin, Pencil } from "lucide-react";
import {
  EditProfileModal,
  type ProfileDraft,
} from "@/components/edit-profile-modal";

function normalizeUrl(raw: string) {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function displayHost(raw: string) {
  try {
    return new URL(normalizeUrl(raw)).host.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

export function ProfileHeader({
  initial,
  userNumber,
  createdAt,
  initialDisplayName,
  initialHeadline,
  initialUsername,
  initialBio,
  initialLocation,
  initialWebsite,
  initialAvatarUrl,
  initialBannerUrl,
}: {
  initial: string;
  userNumber?: number;
  createdAt: string | null;
  initialDisplayName: string;
  initialHeadline: string;
  initialUsername: string;
  initialBio: string;
  initialLocation: string;
  initialWebsite: string;
  initialAvatarUrl: string | null;
  initialBannerUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileDraft>({
    username: initialUsername,
    displayName: initialDisplayName,
    headline: initialHeadline,
    bio: initialBio,
    location: initialLocation,
    website: initialWebsite,
    avatarUrl: initialAvatarUrl,
    bannerUrl: initialBannerUrl,
  });

  const shownName = profile.displayName || `Anonymous #${userNumber}`;
  const avatarInitial =
    shownName.trim().charAt(0).toUpperCase() || initial || "A";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[3/1] w-full bg-primary">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 672px, 100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="relative px-5 pb-5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit profile"
          title="Edit profile"
          className="absolute right-5 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <Pencil size={16} />
        </button>

        <div className="relative -mt-10 h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-surface">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
              {avatarInitial}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <h1 className="text-xl font-bold">{shownName}</h1>
          {profile.username && (
            <span className="text-sm text-secondary">@{profile.username}</span>
          )}
        </div>

        <p className="text-sm text-secondary">
          {profile.headline || "No headline. No ambition either."}
        </p>

        {profile.bio && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} aria-hidden />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={normalizeUrl(profile.website)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <LinkIcon size={14} aria-hidden />
              {displayHost(profile.website)}
            </a>
          )}
          <span>
            User #{userNumber} · here since{" "}
            {createdAt ? new Date(createdAt).toLocaleDateString() : "forever"}
          </span>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          initial={profile}
          onClose={() => setEditing(false)}
          onSaved={setProfile}
        />
      )}
    </div>
  );
}
