import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Only accept same-origin relative paths as a post-login destination.
 * "//evil.com" and "https://evil.com" are protocol-relative / absolute URLs
 * and would walk the user off-site, so they fall back to "/".
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

/**
 * Build the absolute redirect target.
 *
 * `new URL(request.url).origin` is the *upstream* host once a load balancer
 * (Vercel) sits in front of the app, which sends users to an internal
 * hostname. Per the Supabase Next.js server-side auth docs: in development
 * trust `origin`, in production prefer `x-forwarded-host` over https, and
 * fall back to `origin` when the header is absent.
 */
function redirectTo(request: Request, origin: string, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (!isLocalEnv && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  }
  return NextResponse.redirect(`${origin}${path}`);
}

function loginWithError(request: Request, origin: string, reason: string) {
  return redirectTo(
    request,
    origin,
    `/login?error=${encodeURIComponent(reason)}`
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  // Supabase appends these when the link itself is dead on arrival
  // (expired, already consumed, disallowed redirect URL).
  const authError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (authError || errorCode) {
    const reason = errorCode ?? authError ?? "auth_failed";
    console.error("[auth/callback] provider error", {
      authError,
      errorCode,
      errorDescription,
    });
    return loginWithError(request, origin, reason);
  }

  // Shape 1: {{ .ConfirmationURL }} / OAuth — PKCE code exchange.
  const code = searchParams.get("code");
  // Shape 2: {{ .TokenHash }} email template — verifyOtp.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!code && !tokenHash) {
    console.error("[auth/callback] no code or token_hash in callback URL");
    return loginWithError(request, origin, "missing_code");
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      return loginWithError(request, origin, error.code ?? "exchange_failed");
    }
    return redirectTo(request, origin, next);
  }

  if (!type) {
    console.error("[auth/callback] token_hash present without type");
    return loginWithError(request, origin, "missing_type");
  }

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash!,
  });
  if (error) {
    console.error("[auth/callback] verifyOtp failed", {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    return loginWithError(request, origin, error.code ?? "verify_failed");
  }

  return redirectTo(request, origin, next);
}
