"use client";

import { useState, useTransition } from "react";
import { Repeat2 } from "lucide-react";
import { toggleRepost } from "@/app/actions";

export function RepostButton({
  postId,
  count,
  mine,
}: {
  postId: string;
  count: number;
  mine: boolean;
}) {
  const [prevProps, setPrevProps] = useState({ count, mine });
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [optimisticMine, setOptimisticMine] = useState(mine);
  const [, startTransition] = useTransition();

  if (count !== prevProps.count || mine !== prevProps.mine) {
    setPrevProps({ count, mine });
    setOptimisticCount(count);
    setOptimisticMine(mine);
  }

  function handleClick() {
    const wasMine = optimisticMine;
    const wasCount = optimisticCount;

    setOptimisticMine(!wasMine);
    setOptimisticCount(wasMine ? Math.max(0, wasCount - 1) : wasCount + 1);

    startTransition(async () => {
      const result = await toggleRepost(postId);
      if (result?.error) {
        setOptimisticMine(wasMine);
        setOptimisticCount(wasCount);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={optimisticMine}
      aria-label={`Repost${optimisticCount > 0 ? ` (${optimisticCount})` : ""}`}
      title="Repost"
      className={`flex shrink-0 items-center gap-1.5 text-sm transition-colors ${
        optimisticMine ? "text-green-600" : "text-secondary hover:text-green-600"
      }`}
    >
      <Repeat2 size={18} />
      {optimisticCount > 0 ? optimisticCount : ""}
    </button>
  );
}
