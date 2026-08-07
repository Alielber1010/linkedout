"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      aria-label="Sign out"
      className="h-6 w-6 flex items-center justify-center text-lg leading-none hover:opacity-70 transition-opacity disabled:opacity-50"
      title="Sign out"
    >
      🚪
    </button>
  );
}
