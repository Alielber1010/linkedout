"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function WelcomeToast() {
  const [userNumber, setUserNumber] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) return;

      if (localStorage.getItem("welcomed")) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_number")
        .eq("id", userId)
        .single();

      if (!cancelled && profile) {
        setUserNumber(profile.user_number);
        localStorage.setItem("welcomed", "1");
      }
    }

    ensureSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (userNumber === null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-primary bg-surface px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <p className="font-semibold text-foreground">
        Hey 👋 you&apos;re user{" "}
        <span className="text-primary">#{userNumber}</span> on LinkedOut.
      </p>
      <p className="text-sm text-secondary mt-1">
        Welcome to group therapy disguised as a social network.
      </p>
      <button
        onClick={(e) => e.currentTarget.parentElement?.remove()}
        className="absolute top-2 right-2 text-secondary hover:text-foreground"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
