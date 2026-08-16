# LinkedOut

Next.js 16 (App Router) + Supabase social feed app (X/LinkedIn-style,
negativity-only confessions). Tailwind v4, no CSS modules.

## Multi-agent workflow

Three domain subagents live in `.claude/agents/`. The main session is the
orchestrator — subagents can't spawn other subagents, so delegate from here
via the `Agent` tool:

- **`frontend-ui`** — components, pages, styling, accessibility.
- **`backend-supabase`** — Server Actions, Supabase schema/RLS/auth.
- **`qa-visual`** — runs the app for real with Playwright, takes
  screenshots, reads them back to confirm the UI actually looks right, not
  just that assertions passed.

Typical pattern: a UI change → `frontend-ui`, then `qa-visual` to verify
visually. A schema/action/auth change → `backend-supabase`, then
`qa-visual`. Don't skip the `qa-visual` step for anything touching auth,
posting, or forms — this app has already shipped silent breakage there once
(a missing PKCE callback route broke magic-link login end to end without
throwing anywhere).

## Known sharp edges

- `supabase/schema.sql` is a point-in-time dump, not migration history —
  check the live project (Supabase MCP) before trusting it.
- `createPost` / `react` in `src/app/actions.ts` are bot/rate-limit gated
  (`botid` + a DB cooldown check) — keep both when touching those functions.
- Any new email-auth entry point must redirect through
  `src/app/auth/callback/route.ts`, not bare `origin`.
