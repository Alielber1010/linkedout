"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

function Wordmark({ size = "text-2xl" }: { size?: string }) {
  return (
    <span className={`${size} font-extrabold tracking-tight`}>
      <span className="text-primary">Linked</span>
      <span className="text-secondary">Out</span>
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState(false);

  async function goHome() {
    router.push("/");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setPending(false);
    if (error) return setError(error.message);
    setNotice("Magic link sent. Go click it, we'll wait.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const supabase = createClient();

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      setPending(false);
      if (error) return setError(error.message);
      if (!data.session) {
        setNotice(
          "Check your inbox to confirm your email. Then come back and log in."
        );
        return;
      }
      goHome();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (error) return setError(error.message);
    goHome();
  }

  async function handleAnonymous() {
    setError(null);
    setNotice(null);
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    setPending(false);
    if (error) return setError(error.message);
    goHome();
  }

  return (
    <div className="relative mx-auto max-w-sm py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-72 w-[130%] -translate-x-1/2 rounded-full opacity-20"
        style={{ background: "var(--primary)", filter: "blur(90px)" }}
      />

      <div className="relative mb-6 flex items-center gap-2">
        <Image src="/icon.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
        <Wordmark />
      </div>

      <div className="relative">
        <h1 className="text-3xl font-extrabold text-primary">
          Only Negativity Allowed.
        </h1>
        <p className="mt-2 text-secondary text-sm">
          Log in to vent under a name, or skip it and stay a ghost.
        </p>

        <div
          className="mt-8 rounded-2xl border border-border p-5 shadow-[0_0_50px_-20px_var(--primary)]"
        >
          <div
            className={`flex rounded-full border border-border p-0.5 mb-5 text-sm ${
              magicLink ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded-full py-1.5 transition-colors ${
                mode === "sign-in"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-full py-1.5 transition-colors ${
                mode === "sign-up"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form
            onSubmit={magicLink ? handleMagicLink : handleSubmit}
            className="space-y-3"
          >
            <div>
              <input
                type="email"
                required
                placeholder="you@notmycurrentemployer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {!magicLink && (
              <div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-xs text-secondary">
                  6 characters minimum. That&apos;s it, that&apos;s the whole
                  policy. Nobody&apos;s auditing your password strength here.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-primary">{error}</p>}
            {notice && <p className="text-sm text-secondary">{notice}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 disabled:opacity-50"
            >
              {pending
                ? "Working on it..."
                : magicLink
                ? "Send magic link"
                : mode === "sign-up"
                ? "Create account"
                : "Log in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMagicLink((v) => !v);
                setError(null);
                setNotice(null);
              }}
              className="w-full text-center text-xs text-secondary hover:text-primary hover:underline"
            >
              {magicLink
                ? "‹ Use a password instead"
                : "Prefer a magic link? No password needed →"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-secondary">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleAnonymous}
            disabled={pending}
            className="w-full rounded-full border border-primary/40 bg-black text-white text-sm font-semibold py-2.5 shadow-[0_0_20px_-6px_var(--primary)] transition-shadow hover:shadow-[0_0_28px_-4px_var(--primary)] disabled:opacity-50"
          >
            Continue anonymously <span aria-hidden>👻</span>
          </button>
          <p className="mt-2 text-center text-xs text-secondary">
            No name, no profile, no trail. Just vibes and grievances.
          </p>
        </div>
      </div>
    </div>
  );
}
