"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [trackedQuery, setTrackedQuery] = useState(urlQuery);
  const [value, setValue] = useState(urlQuery);

  if (urlQuery !== trackedQuery) {
    setTrackedQuery(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === urlQuery) return;

    const timeout = setTimeout(() => {
      router.replace(
        trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"
      );
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search
        size={16}
        strokeWidth={1.75}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search the rants..."
        className="w-full rounded-full border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
