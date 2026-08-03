"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TAGS } from "@/lib/tags";

export function TagFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tag");

  function select(tag: string | null) {
    if (!tag) {
      router.push("/");
    } else {
      router.push(`/?tag=${encodeURIComponent(tag)}`);
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
      <button
        onClick={() => select(null)}
        className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
          !active
            ? "bg-primary text-white border-primary"
            : "border-border text-secondary hover:border-primary"
        }`}
      >
        All
      </button>
      {TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => select(tag)}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
            active === tag
              ? "bg-primary text-white border-primary"
              : "border-border text-secondary hover:border-primary"
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
