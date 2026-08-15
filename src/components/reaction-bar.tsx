"use client";

import { useState, useTransition } from "react";
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
  const [optimisticMine, setOptimisticMine] = useState(mine);
  const [optimisticCounts, setOptimisticCounts] = useState(counts);
  const [, startTransition] = useTransition();

  function handleClick(type: ReactionType) {
    const wasMine = optimisticMine;
    const next = wasMine === type ? null : type;

    setOptimisticCounts((prev) => {
      const updated = { ...prev };
      if (wasMine) updated[wasMine] = Math.max(0, updated[wasMine] - 1);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });
    setOptimisticMine(next);

    startTransition(async () => {
      await react(postId, type);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = optimisticCounts[type] ?? 0;
        const active = optimisticMine === type;
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
                  }
                : undefined
            }
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors ${
              active ? "" : "border-border text-secondary hover:border-primary"
            }`}
          >
            <span>{emoji}</span>
            <span>{count > 0 ? count : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
