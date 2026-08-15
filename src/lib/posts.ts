import type { ReactionType } from "@/lib/tags";

export const PAGE_SIZE = 20;

export const EMPTY_REACTION_COUNTS: Record<ReactionType, number> = {
  been_there: 0,
  same: 0,
  red_flag: 0,
  escaped: 0,
  corporate: 0,
};

export const POSTS_SELECT =
  "id, profile_id, body, role, company, tags, created_at, is_anonymous, profiles!posts_profile_id_fkey(user_number, display_name, headline), reactions(profile_id, reaction_type)";

type ProfileRow = {
  user_number: number;
  display_name: string | null;
  headline: string | null;
};

export type PostRow = {
  id: string;
  profile_id: string;
  body: string;
  role: string | null;
  company: string | null;
  tags: string[] | null;
  created_at: string;
  is_anonymous: boolean;
  profiles: ProfileRow | ProfileRow[] | null;
  reactions: { profile_id: string; reaction_type: string }[] | null;
};

export type MappedPost = {
  id: string;
  profileId: string;
  body: string;
  role: string | null;
  company: string | null;
  tags: string[];
  createdAt: string;
  userNumber: number;
  displayName: string | null;
  headline: string | null;
  isAnonymous: boolean;
  counts: Record<ReactionType, number>;
  mine: ReactionType | null;
  isOwner: boolean;
};

export function mapPost(post: PostRow, currentUserId: string | null): MappedPost {
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const counts = { ...EMPTY_REACTION_COUNTS };
  let mine: ReactionType | null = null;

  for (const r of post.reactions ?? []) {
    const type = r.reaction_type as ReactionType;
    counts[type] = (counts[type] ?? 0) + 1;
    if (currentUserId && r.profile_id === currentUserId) mine = type;
  }

  return {
    id: post.id,
    profileId: post.profile_id,
    body: post.body,
    role: post.role,
    company: post.company,
    tags: post.tags ?? [],
    createdAt: post.created_at,
    userNumber: profile?.user_number ?? 0,
    displayName: profile?.display_name ?? null,
    headline: profile?.headline ?? null,
    isAnonymous: post.is_anonymous,
    counts,
    mine,
    isOwner: currentUserId != null && post.profile_id === currentUserId,
  };
}
