# Design — Upgrade monorepo to Next.js 15 + React 19 (RMP-207)

- **Date:** 2026-06-12
- **Linear:** [RMP-207](https://linear.app/rmp-tech/issue/RMP-207/epic-upgrade-monorepo-to-nextjs-15-react-19)
- **Branch:** `lucasrmagalhaes/rmp-207-epic-upgrade-monorepo-to-nextjs-15-react-19`
- **Status:** approved (design)

## Overview

Upgrade the entire Crivelo Turborepo monorepo from **Next 14.2 + React 18.3** to
**Next 15 + React 19**, in a **single atomic PR**. Both apps (`crivelo-web`,
`crema-arena`) and both shared packages (`@crivelo/ui`, `@crivelo/tokens`) move
together so the one `pnpm-lock.yaml` changes exactly once and the workspace is
internally consistent. `crivelo-web` is the canary (lowest risk, already
part-migrated); `crema-arena` plus the Auth.js v5 migration is the heavy end.

This realizes the deferred RMP-207 epic: React 19's ref-as-prop model makes the
shadcn new-york v4 primitives in `@crivelo/ui` correct against upstream, and Next
15 is the framework floor React 19 requires.

## Recon findings (what's actually true in the tree)

Two scope assumptions in the epic are stale and are corrected here:

1. **`@crivelo/ui` has no `forwardRef` shims.** All primitives in
   `packages/ui/src/**` are function components. The RMP-205/206 "forwardRef
   mitigation" the epic refers to does not exist in the shared package. Epic
   sub-task 3 ("remove the forwardRef shims") is therefore reframed to **confirm
   the primitives are verbatim-upstream new-york and remove any React-18
   known-limitation notes** — there is nothing to delete.
2. **The async-API + caching audit is near-empty.** No `cookies()`, `headers()`,
   or `draftMode()` usage anywhere. No `unstable_cache`, no
   `dynamic`/`revalidate`/`fetchCache` segment config. Data is client-side SWR
   polling. The only async-request-API work is `params` / `searchParams`,
   concentrated in `crema-arena`.

The four `forwardRef` instances that DO exist are app-local hand-rolled wrappers,
unrelated to the package mitigation:

- `apps/crema-arena/app/components/ui/Input.tsx:31`
- `apps/crivelo-web/components/ui/Button.tsx:25`
- `apps/crivelo-web/components/shell/Header.tsx:17`

`crivelo-web` already uses the Next-15 async `params` shape in
`app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, and
`app/pwa-icon/[variant]/route.tsx`.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | **Migrate crema-arena to Auth.js v5** (`next-auth@5`) | Clean Next 15 middleware story (`auth()` wrapper); avoids fighting v4 `getToken` rough edges on App Router |
| Verification gate | **tsc + build + dev smoke + Playwright screenshots now; committed e2e suite as a follow-up** | Matches the epic's "dev-only" intent without losing the e2e debt; gate is real and runnable today |
| Delivery | **One atomic PR** for the whole monorepo | Single lockfile change, one consistent workspace, all-or-nothing green |

## Scope

### In scope
- Bump `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` across
  root + both apps + both packages; verify a clean `pnpm install`.
- Run `@next/codemod@canary upgrade latest` and `react-codemod` where they apply.
- Convert crema-arena sync `{ params }` → `Promise<>` (30+ route handlers + 2 pages).
- Migrate crema-arena auth to Auth.js v5 (config, middleware, session/JWT
  callbacks, env var renames).
- Compatibility-verify `next-intl@4.13` (crivelo-web) and `motion@11.11`
  (crema-arena); bump if required.
- Drop the three app-local `forwardRef` wrappers in favor of ref-as-prop.
- Confirm `@crivelo/ui` primitives are verbatim-upstream new-york; remove
  React-18 known-limitation notes.

### Out of scope
- A committed Playwright e2e suite (tracked as a follow-up issue).
- Any feature, design, or copy change. This is a framework upgrade only.
- Migrating SWR polling to Server Components / server actions.
- Vercel env-var renames in the dashboard (manual op step, see Risks).

## Workstreams

Analysis is parallelizable; the dependency/lockfile bump is serial because it is
a single workspace.

- **A — Dependency bump (serial, owns lockfile).** root + both apps + both
  packages to `next@15` / `react@19` / `react-dom@19` / `@types/react@19` /
  `@types/react-dom@19`. Bump the packages' React dev-deps to 19 and widen peer
  ranges to cover 19. Verify `pnpm install` is clean (watch radix / sonner /
  motion peer warnings). Risk: Med.
- **B — crivelo-web.** Run `@next/codemod upgrade`; verify the already-async
  `params`; `next-intl@4.13` Next-15 compat check (bump if needed); drop
  `forwardRef` in `Button` / `Header`; tsc + build + dev smoke. Risk: Low.
- **C — crema-arena codemods.** `@next/codemod` + `react-codemod`; convert sync
  `{ params }` → `Promise<>` across 30+ route handlers + 2 pages
  (`live/[eventId]`, `e/[eventId]`); drop `forwardRef` in `Input`; `motion@11.11`
  React-19 check. Risk: Med.
- **D — Auth.js v5 (crema-arena). Dominant risk — own focused agent.**
  `next-auth@5`: rewrite `lib/auth.ts`, `middleware.ts` → `auth()` wrapper
  (replaces `getToken`), session/JWT callbacks, env rename `NEXTAUTH_*` →
  `AUTH_*`. Sequenced **after C** so one agent owns crema-arena auth files at a
  time. Risk: High.
- **E — packages (`@crivelo/ui`, `@crivelo/tokens`).** Bump React dev-deps → 19;
  confirm primitives are verbatim-upstream new-york; remove React-18
  known-limitation notes. No forwardRef shims to remove (see recon). Risk: Low.
- **F — Verification gate.** tsc (all) + `turbo build` (all) + dev smoke both
  apps + Playwright screenshots of login / dashboard / live display / COA
  calculator. File a follow-up Linear issue for the committed e2e suite.

### Execution model
Dependency bump (A) lands first in the tree. Then dispatch parallel subagents
over disjoint file sets — B, C, E touch independent directories. D runs as its
own agent **after** C (same app, no concurrent edits to crema-arena). Converge,
then run verification (F). This is subagent-driven-development in the current
worktree; no separate git worktrees are needed since it is one PR / one tree.

## Acceptance criteria

- [ ] `pnpm install` completes clean (no unmet peer-dependency errors) with
      `next@15`, `react@19`, `react-dom@19` across root + both apps + both packages.
- [ ] `pnpm turbo run build` is green for `crivelo-web`, `crema-arena`,
      `@crivelo/ui`, `@crivelo/tokens`.
- [ ] `tsc --noEmit` passes in both apps and both packages.
- [ ] All crema-arena dynamic `params` use the awaited `Promise<>` shape; no
      sync-`params` deprecation warnings at build.
- [ ] crema-arena auth works on Auth.js v5: login as `qa@crema-arena.com`
      succeeds, protected routes redirect when unauthenticated, session persists.
- [ ] `next dev` boots both apps; Playwright screenshots captured for login,
      dashboard, live display, and COA calculator with no console errors.
- [ ] `next-intl` locale routing in crivelo-web still works (pt-BR / locale
      switch) post-upgrade.
- [ ] `motion` animations render without React-19 runtime warnings.
- [ ] `@crivelo/ui` primitives confirmed verbatim-upstream new-york; React-18
      known-limitation notes removed.
- [ ] A follow-up Linear issue exists for the committed Playwright e2e suite.

## Risks

- **Auth.js v4 → v5 is the dominant risk.** Env var names change
  (`NEXTAUTH_SECRET` → `AUTH_SECRET`), and the session/JWT callback and
  middleware shapes change. This touches the QA login (`qa@crema-arena.com`) and
  the credentials flow in `lib/auth.ts`. Mitigation: dedicated agent, verify the
  full login → protected-route → session cycle in dev before declaring done.
- **Vercel env vars are a manual op step outside the code PR.** Before `main`
  deploys to prod, the crema-arena Vercel project needs the renamed `AUTH_*`
  vars set (prod + preview/development). The PR must not merge to a deploy
  without this; call it out in the PR description.
- **One atomic PR = large, all-or-nothing diff.** Mitigate with a clear,
  staged commit history within the PR (dep bump → per-stream changes → verify)
  so review is followable.
- **Transitive peer-dependency churn.** React 19 peer ranges may surface
  warnings across radix / sonner / motion / next-auth. Verify install is clean,
  not just resolvable.
- **`next-intl@4.13` / `motion@11.11` compat is unverified.** Both may need a
  minor bump for Next 15 / React 19. Confirm against their release notes during
  B / C.

## Follow-ups (out of this PR)
- Committed Playwright e2e suite for crema-arena critical flows (auth, dashboard
  CRUD, live display) and crivelo-web COA calculator — new Linear issue.
- Vercel env-var rename for Auth.js v5 in the crema-arena project (op task,
  before prod deploy).
