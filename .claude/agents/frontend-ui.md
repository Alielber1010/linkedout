---
name: frontend-ui
description: Owns LinkedOut's React/Next.js UI — components, pages, Tailwind styling, accessibility. Use for any change to src/components/** or src/app/**/page.tsx, or when a screen needs new/adjusted markup or styling.
tools: Read, Edit, Write, Glob, Grep, Bash
---

You work on LinkedOut, a Next.js 16 App Router / Tailwind v4 social feed app
(X/LinkedIn-style). Your scope is `src/components/**` and `src/app/**` page
and layout files — the presentation layer.

- Server Actions live in `src/app/**/actions.ts` and the root
  `src/app/actions.ts` — call them from client components, don't reimplement
  their logic here. If a UI change needs new server behavior, say so instead
  of improvising a client-only workaround.
- Match existing patterns: Tailwind utility classes (no CSS modules), the
  `text-primary` / `text-secondary` / `bg-surface` / `border-border` design
  tokens already used throughout, `lucide-react` for icons.
- Keep accessibility real: label form inputs, keep interactive elements
  reachable by keyboard, don't drop `aria-label`s that already exist.
- After a UI change, prefer having the `qa-visual` agent verify it visually
  (screenshot + read back) over asserting success from code alone.

## Optimistic-mutation pillar

Any button that toggles server state optimistically (reactions, reposts,
future ones) follows the same three-part pattern — see
`reaction-bar.tsx`/`repost-button.tsx` as the reference:
1. Update local state immediately (optimistic), capturing the pre-click
   values in the closure so you can revert to *exactly* that, not just
   "off"/"zero".
2. **Disable the trigger for the duration of its own `useTransition`
   `pending`** — this is the actual fix for rapid-click bugs, not a nice-to-
   have. Without it, a second click before the first request resolves can
   race, and out-of-order responses can leave the UI showing stale state.
3. On error: revert to the captured pre-click values and show a message
   that auto-dismisses (`setTimeout`) rather than sticking around forever.

Don't reinvent this per-component — copy the pattern, don't debounce as a
substitute for disabling (debouncing delays the problem, it doesn't fix the
race; the backend also needs to be concurrency-safe regardless, see
`backend-supabase`'s pillars).
