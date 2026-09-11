"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { checkUsernameAvailable } from "@/app/profile/actions";

type Mode = "sign-in" | "sign-up";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function Wordmark({ size = "text-2xl" }: { size?: string }) {
  return (
    <span className={`${size} font-extrabold tracking-tight`}>
      <span className="text-primary">Linked</span>
      <span className="text-secondary">Out</span>
    </span>
  );
}

/**
 * Error codes handed back by /auth/callback (Supabase's own `error_code`, or
 * one of ours when the link arrives malformed).
 */
function describeAuthError(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "otp_expired":
      return "That magic link expired. They only last an hour — request a fresh one.";
    case "access_denied":
      return "That link was already used or revoked. Send yourself a new one.";
    case "missing_code":
    case "missing_type":
      return "That link came back mangled — no login token in it. Try requesting another.";
    case "flow_state_not_found":
    case "flow_state_expired":
    case "bad_code_verifier":
    case "pkce_code_verifier_not_found":
      return "Open the link in the same browser you requested it from — otherwise we can't finish the login.";
    case "validation_failed":
      return "The login link wasn't valid. Request a new one.";
    default:
      return "Couldn't finish signing you in. Request a new link and try again.";
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    describeAuthError(searchParams.get("error"))
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUsernameChange(value: string) {
    setUsername(value);
    const normalized = value.trim().toLowerCase();

    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      const result = await checkUsernameAvailable(normalized);
      setUsernameStatus(result.available ? "available" : "taken");
    }, 400);
  }

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

    try {
      if (mode === "sign-up") {
        const normalizedUsername = username.trim().toLowerCase();
        if (!USERNAME_PATTERN.test(normalizedUsername)) {
          return setError(
            "Pick a username first: 3-20 characters, lowercase letters/numbers/underscores."
          );
        }
        if (usernameStatus === "taken") {
          return setError("That username's taken — pick another.");
        }

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
        if (error) return setError(error.message);
        if (!data.session || !data.user) {
          setNotice(
            "Check your inbox to confirm your email. Then come back and log in — you can set your username from your profile once you're in."
          );
          return;
        }

        // Use the same client session that just signed up, rather than a
        // server action — avoids any race with the auth cookie propagating
        // to the server before the next request reads it.
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: normalizedUsername })
          .eq("id", data.user.id);
        if (profileError) {
          if (profileError.code === "23505") {
            return setError("That username's taken — someone just claimed it.");
          }
          return setError(profileError.message);
        }
        goHome();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return setError(error.message);
      goHome();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong — try again in a moment."
      );
    } finally {
      setPending(false);
    }
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
    <div className="relative mx-auto grid min-h-[calc(100dvh-10rem)] max-w-5xl items-start gap-10 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="relative flex flex-col justify-center pt-4 lg:pt-8">
        <div className="flex flex-col gap-4">
          <Image
            src="/icon.png"
            alt=""
            width={128}
            height={128}
            className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32"
            priority
          />
          <Wordmark size="text-5xl sm:text-6xl lg:text-7xl" />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold text-primary sm:text-3xl lg:text-4xl">
          Only Negativity Allowed.
        </h1>
        <p className="mt-3 max-w-md text-sm text-secondary sm:text-base">
          Log in to vent under a name, or skip it and stay a ghost.
        </p>
      </div>

      <div className="relative w-full max-w-xs justify-self-center pt-8 sm:max-w-sm lg:mt-20 lg:max-w-[340px] lg:justify-self-end lg:pt-0">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-6 left-1/2 h-56 w-[120%] -translate-x-1/2 rounded-full opacity-20"
          style={{ background: "var(--primary)", filter: "blur(80px)" }}
        />

        <div className="relative rounded-2xl border border-border p-4 shadow-[0_0_40px_-20px_var(--primary)]">
          <div
            className={`mb-4 flex rounded-full border border-border p-0.5 text-xs sm:text-sm ${
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
            className="space-y-2.5"
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

            {mode === "sign-up" && !magicLink && (
              <div>
                <div className="flex items-center rounded-md border border-border bg-background focus-within:border-primary">
                  <span className="pl-3 text-sm text-secondary">@</span>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    pattern="[a-z0-9_]{3,20}"
                    maxLength={20}
                    className="w-full bg-transparent px-1.5 py-2 text-sm outline-none"
                  />
                </div>
                <p
                  className={`mt-1 text-xs ${
                    usernameStatus === "taken" || usernameStatus === "invalid"
                      ? "text-primary"
                      : usernameStatus === "available"
                      ? "text-green-600"
                      : "text-secondary"
                  }`}
                >
                  {usernameStatus === "checking" && "Checking availability..."}
                  {usernameStatus === "available" && "That username is free."}
                  {usernameStatus === "taken" && "Someone already claimed that one."}
                  {usernameStatus === "invalid" &&
                    "Lowercase letters, numbers, underscores. 3–20 characters."}
                  {usernameStatus === "idle" &&
                    "This is how people will @ you — you can change it later."}
                </p>
              </div>
            )}

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
              disabled={
                pending ||
                (mode === "sign-up" &&
                  !magicLink &&
                  (usernameStatus === "checking" ||
                    usernameStatus === "taken" ||
                    usernameStatus === "invalid" ||
                    usernameStatus === "idle"))
              }
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

          <div className="my-3 flex items-center gap-3 text-xs text-secondary">
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
