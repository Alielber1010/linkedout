"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Repeat2 } from "lucide-react";
import { toggleRepost } from "@/app/actions";
import { QuoteModal } from "@/components/quote-modal";

export function RepostButton({
  postId,
  count,
  mine,
  quotedBody,
  quotedIdentity,
  quotedIsAnonymous,
  quotedCreatedAt,
}: {
  postId: string;
  count: number;
  mine: boolean;
  quotedBody: string;
  quotedIdentity: string;
  quotedIsAnonymous: boolean;
  quotedCreatedAt: string;
}) {
  const [prevProps, setPrevProps] = useState({ count, mine });
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [optimisticMine, setOptimisticMine] = useState(mine);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  if (count !== prevProps.count || mine !== prevProps.mine) {
    setPrevProps({ count, mine });
    setOptimisticCount(count);
    setOptimisticMine(mine);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleRepost() {
    setMenuOpen(false);
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-pressed={optimisticMine}
        aria-label={`Repost${optimisticCount > 0 ? ` (${optimisticCount})` : ""}`}
        title="Repost"
        className={`flex shrink-0 items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          optimisticMine ? "text-green-600" : "text-secondary hover:text-green-600"
        }`}
      >
        <Repeat2 size={18} />
        {optimisticCount > 0 ? optimisticCount : ""}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleRepost}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-surface transition-colors"
          >
            <Repeat2 size={16} />
            {optimisticMine ? "Undo repost" : "Repost"}
          </button>
          <button
            type="button"
            role="menuitem"
            aria-label="Quote"
            onClick={() => {
              setMenuOpen(false);
              setQuoteOpen(true);
            }}
            className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-medium hover:bg-surface transition-colors"
          >
            <span aria-hidden className="font-serif text-base leading-none">&rdquo;</span>
            Quote
          </button>
        </div>
      )}

      {quoteOpen && (
        <QuoteModal
          postId={postId}
          quotedBody={quotedBody}
          quotedIdentity={quotedIdentity}
          quotedIsAnonymous={quotedIsAnonymous}
          quotedCreatedAt={quotedCreatedAt}
          onClose={() => setQuoteOpen(false)}
        />
      )}
    </div>
  );
}
