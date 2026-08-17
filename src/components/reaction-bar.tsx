"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { react } from "@/app/actions";
import type { ReactionType } from "@/lib/tags";

const LIKE_REACTION: ReactionType = "red_flag";

function formatCount(count: number) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(".0", "")}K`;
  }
  return count > 0 ? String(count) : "";
}

export function ReactionBar({
  postId,
  counts,
  mine,
}: {
  postId: string;
  counts: Record<ReactionType, number>;
  mine: ReactionType | null;
}) {
  const [prevProps, setPrevProps] = useState({ counts, mine });
  const [optimisticMine, setOptimisticMine] = useState(mine);
  const [optimisticCounts, setOptimisticCounts] = useState(counts);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (counts !== prevProps.counts || mine !== prevProps.mine) {
    setPrevProps({ counts, mine });
    setOptimisticCounts(counts);
    setOptimisticMine(mine);
  }

  const optimisticTotal = Object.values(optimisticCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const active = optimisticMine === LIKE_REACTION;

  function handleClick(type: ReactionType) {
    const wasMine = optimisticMine;
    const wasCounts = optimisticCounts;
    const next = wasMine === type ? null : type;

    setError(null);
    setOptimisticCounts((prev) => {
      const updated = { ...prev };
      if (wasMine) updated[wasMine] = Math.max(0, updated[wasMine] - 1);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });
    setOptimisticMine(next);

    startTransition(async () => {
      try {
        const result = await react(postId, type);
        if (result?.error) throw new Error(result.error);
      } catch {
        setOptimisticCounts(wasCounts);
        setOptimisticMine(wasMine);
        setError("Reaction didn't save - try again.");
        setTimeout(() => setError(null), 4000);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => handleClick(LIKE_REACTION)}
        disabled={pending}
        title="Like"
        aria-label={`Like${optimisticTotal > 0 ? ` (${optimisticTotal})` : ""}`}
        aria-pressed={active}
        className={`group flex h-9 min-w-0 items-center gap-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          active ? "text-pink-600" : "text-secondary hover:text-pink-600"
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors group-hover:bg-pink-600/10">
          <Heart size={18} fill={active ? "currentColor" : "none"} />
        </span>
        <span className="min-w-0 tabular-nums">{formatCount(optimisticTotal)}</span>
      </button>
      {error && <p className="mt-1 text-xs text-primary">{error}</p>}
    </div>
  );
}
