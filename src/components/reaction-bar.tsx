"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { react } from "@/app/actions";
import { REACTIONS, type ReactionType } from "@/lib/tags";

const COLOR_VAR: Record<ReactionType, string> = {
  been_there: "var(--reaction-been-there)",
  same: "var(--reaction-same)",
  red_flag: "var(--reaction-red-flag)",
  escaped: "var(--reaction-escaped)",
  corporate: "var(--reaction-corporate)",
};

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
  const [, startTransition] = useTransition();

  // Re-seed from fresh server props (e.g. another reaction elsewhere triggered
  // a feed revalidation) without clobbering an in-flight optimistic click.
  if (counts !== prevProps.counts || mine !== prevProps.mine) {
    setPrevProps({ counts, mine });
    setOptimisticCounts(counts);
    setOptimisticMine(mine);
  }

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
        setError("Reaction didn't save — try again.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-nowrap items-center gap-2">
        {REACTIONS.map(({ type, label }) => {
          const count = optimisticCounts[type] ?? 0;
          const active = optimisticMine === type;
          const isPrimary = type === "red_flag";
          return (
            <button
              key={type}
              onClick={() => handleClick(type)}
              title={label}
              aria-label={`${label}${count > 0 ? ` (${count})` : ""}`}
              aria-pressed={active}
              style={
                active
                  ? {
                      borderColor: COLOR_VAR[type],
                      color: COLOR_VAR[type],
                      backgroundColor: isPrimary ? `color-mix(in srgb, ${COLOR_VAR[type]} 12%, transparent)` : undefined,
                    }
                  : undefined
              }
              className={`flex shrink-0 items-center gap-1 rounded-full border whitespace-nowrap transition-colors ${
                isPrimary ? "px-2.5 py-1.5 text-sm font-medium" : "px-2.5 py-1 text-xs font-medium"
              } ${active ? "" : "border-border text-secondary hover:border-primary"}`}
            >
              {isPrimary ? (
                <Flag size={15} fill={active ? "currentColor" : "none"} />
              ) : (
                <span>{label}</span>
              )}
              <span>{count > 0 ? count : ""}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-primary">{error}</p>}
    </div>
  );
}
