import { ReactionBar } from "@/components/reaction-bar";
import type { ReactionType } from "@/lib/tags";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostCard({
  id,
  body,
  role,
  company,
  tags,
  createdAt,
  userNumber,
  counts,
  mine,
}: {
  id: string;
  body: string;
  role: string | null;
  company: string | null;
  tags: string[];
  createdAt: string;
  userNumber: number;
  counts: Record<ReactionType, number>;
  mine: ReactionType | null;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold">Anonymous #{userNumber}</span>
        {role && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary">
            {role}
          </span>
        )}
        {company && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary">
            {company}
          </span>
        )}
        <span className="text-secondary text-xs ml-auto">
          {timeAgo(createdAt)}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{body}</p>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="text-xs text-primary hover:underline"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      <ReactionBar postId={id} counts={counts} mine={mine} />
    </article>
  );
}
