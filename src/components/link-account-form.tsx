"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LinkAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const supabase = createClient();
    // Updating email/password on an anonymous session converts the same
    // account to a permanent one — same user id, so existing posts and
    // profile data carry over untouched.
    const { data, error } = await supabase.auth.updateUser({ email, password });
    setPending(false);
    if (error) return setError(error.message);

    if (!data.user?.email_confirmed_at) {
      setNotice("Check your inbox to confirm this email — your posts and profile stay right where they are.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-secondary">
        Add an email and password so you can log back in later — your ghost
        history stays exactly as it is.
      </p>
      <input
        type="email"
        required
        placeholder="you@notmycurrentemployer.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {error && <p className="text-sm text-primary">{error}</p>}
      {notice && <p className="text-sm text-secondary">{notice}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-1.5 disabled:opacity-50"
      >
        {pending ? "Linking..." : "Save account"}
      </button>
    </form>
  );
}
