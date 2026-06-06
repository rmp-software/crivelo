---
slug: crivelo-monorepo-structure
status: planned
created: 2026-06-06
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-134
feature_branch: feature/crivelo-monorepo
---

# Crivelo monorepo structure

## Overview

Restructure the single Crema Arena Next.js app into a **Turborepo monorepo** under the
umbrella brand **Crivelo**, so the planned family of coffee-community tools (cupping,
V60/4:6, portal, dictionary, blog) can share one design system while staying independent
apps. This spec covers **standing up the monorepo and migrating Crema Arena into it** —
not building any sibling app, and not yet pulling in the new Crivelo visual identity.

The decision record this implements is `docs/crivelo-umbrella.md`. The locked decisions
driving this work:

- **New `crivelo` repo** (not an in-place rename). Crema Arena moves in as
  `apps/crema-arena` with full git history preserved via `git filter-repo` — **no git
  submodules** anywhere.
- **pnpm** workspaces + **Turborepo**.
- **`@crivelo/*`** package scope.
- **Package layout B**: split `@crivelo/tokens` (CSS foundation, tailwind preset, fonts,
  house brand assets — zero React) from `@crivelo/ui` (React primitives), plus
  `@crivelo/tsconfig` and `@crivelo/eslint-config`.

The reusable surface is the **brand / design system**, not application logic. `bracket.ts`,
`crowd-vote.ts`, the judge-voting model, and split-cadence polling are all TNT-specific and
stay inside `apps/crema-arena`. Auth and DB are **not** shared — each app owns its own data.

## Problem / motivation

Crema Arena is one product in a planned umbrella ("Crema Arena by Crivelo"). The genuinely
reusable thing across the family is the design foundation — color tokens, the four
typefaces, brand assets, and a few UI primitives — not the tournament logic. A monorepo with
a shared design-system package lets every future tool inherit one brand without copy-paste
drift, while keeping each app's data and logic isolated. 4–6 planned surfaces sharing one
brand justify the Turborepo overhead that two hypothetical apps wouldn't.

The hard part is doing this **without breaking live production** at `crema-arena.com`
(Vercel auto-deploys `main`). The migration is therefore phased so each step is
independently verifiable, and the production cutover is deliberate and reversible.

## Scope

**In scope (this spec):**
- New `crivelo` Turborepo monorepo: pnpm workspaces, `turbo.json`, root config.
- Config packages: `@crivelo/tsconfig`, `@crivelo/eslint-config`.
- Migrating Crema Arena into `apps/crema-arena` with history preserved; app builds and runs
  identically.
- Extracting the **existing** Crema Arena design system into `@crivelo/tokens` +
  `@crivelo/ui` (Tier-1 foundation + primitives), with cinnamon kept as a Tier-2 accent
  override inside the app and competition personality (Tier 3) staying in the app.
- New Vercel project + production domain cutover for Crema Arena.

**Out of scope (follow-up specs):**
- **Crivelo design-system pull-in + Crema Arena re-skin (Phase 3).** Replacing the package
  contents with the Claude Design Crivelo output and re-skinning Arena onto the neutral
  foundation. This is a visual rebrand and gets its own spec.
- Any sibling app (Mesa, Coa, portal, Léxico, Diário).
- Extracting utilities (`file-upload.ts`, `device-id.ts`) — only when a 2nd app needs them.
- Vercel remote caching, CI changes beyond what deployment requires.

## Target repo layout

```
crivelo/                         ← new repo, root
├─ apps/
│  └─ crema-arena/               ← migrated app (history preserved)
│     ├─ app/  lib/  prisma/  public/
│     ├─ middleware.ts  next.config.js  vercel.json
│     ├─ tailwind.config.ts      ← extends @crivelo/tokens preset
│     └─ package.json            ← name: "crema-arena"
├─ packages/
│  ├─ tokens/                    @crivelo/tokens   (CSS foundation, tailwind preset, fonts, house brand assets — zero React)
│  ├─ ui/                        @crivelo/ui       (React primitives; depends on tokens)
│  ├─ tsconfig/                  @crivelo/tsconfig (base + nextjs bases)
│  └─ eslint-config/             @crivelo/eslint-config
├─ pnpm-workspace.yaml           ← apps/*, packages/*
├─ turbo.json                    ← build / dev / lint / type-check pipeline
├─ package.json                  ← root: turbo, prettier, typescript (hoisted dev deps)
└─ tsconfig.json                 ← root base
```

## Tooling

- **pnpm workspaces + Turborepo.** `turbo.json` pipeline: `build` (depends on `^build`),
  `dev` (persistent, uncached), `lint`, `type-check`. Remote caching off for now.
- **Config packages** carry the "share presets to prevent drift" decision. Nearly free.
- **Internal linking** via `workspace:*`. Apps add `@crivelo/ui` and `@crivelo/tokens` to
  `transpilePackages` in `next.config.js` — packages ship raw TS/TSX, no build step.

## Design-system extraction → tier mapping

- **`@crivelo/tokens`** (Tier-1 foundation): `globals.css` CSS variables (neutrals, radii,
  shadows, motion, semantic success/danger), the Tailwind **preset** (the `theme.extend`
  block currently in `tailwind.config.ts`), `public/fonts/*` + a font module, and the
  Crivelo house brand assets. Apps consume the preset via
  `presets: [require('@crivelo/tokens/tailwind')]`.
- **`@crivelo/ui`** (primitives): `Button`, `Card`, `Input`, `Badge`, `Toast`,
  `ConfirmationModal`, `Modal`, `LoadingSpinner`, `EmptyState`, `PageHeader`.
- **Stays in `apps/crema-arena`** (Tier 2 + 3): the cinnamon accent (the ~5 `--brand*`
  vars, as a root override) and all competition personality — `BracketView`, podium,
  `AO VIVO` badge, `CrowdVoteBar`, `trophy.svg` / `rings.svg` / `stamp-seal.svg`, score
  components.
- **Font caveat:** `next/font/local` must be statically analyzable, so the font loader
  lives in `@crivelo/tokens` and is consumed via `transpilePackages`. This is the one bit of
  cross-package wiring to verify early.

## Production cutover (Crema Arena)

New repo + new Vercel project means the live domain moves deliberately:

1. New Vercel project → points at `crivelo` repo, **Root Directory = `apps/crema-arena`**
   (Vercel auto-detects pnpm + turbo).
2. Replicate **all env vars** into the new project: `DATABASE_URL` (prod DB), `NEXTAUTH_*`,
   `ADMIN_*`, `BLOB_READ_WRITE_TOKEN`.
3. Deploy to the Vercel-generated URL first; smoke-test against the real prod DB (login,
   live page, one upload).
4. Only then move `crema-arena.com` from the old project to the new one.
5. Keep the old repo + project as rollback until verified; archive afterward.

## Implementation phases / task breakdown

Each task is independently verifiable. Tasks 1–5 are **Phase 1 (structural migration)**;
tasks 6–8 are **Phase 2 (design-system extraction)**.

### Task 1 — Scaffold the crivelo monorepo skeleton
Create the new `crivelo` repo root: `pnpm-workspace.yaml` (`apps/*`, `packages/*`),
`turbo.json` (build/dev/lint/type-check pipeline), root `package.json` (turbo, prettier,
typescript as hoisted dev deps), root `tsconfig.json`, `.gitignore`, `.nvmrc` (Node 24).
**Verify:** `pnpm install` succeeds; `pnpm turbo run build` runs (no-op with no apps yet)
without error.

### Task 2 — Config packages
Create `@crivelo/tsconfig` (`base.json` + `nextjs.json`) and `@crivelo/eslint-config`.
**Verify:** a throwaway package that extends `@crivelo/tsconfig/base.json` type-checks;
eslint config resolves.

### Task 3 — Migrate Crema Arena into `apps/crema-arena` (history preserved)
Use `git filter-repo` to rewrite Crema Arena history under `apps/crema-arena/`, bring it
into the `crivelo` repo. Move `prisma/`, `vercel.json`, env handling into the app. Add the
app `package.json` (name `crema-arena`), wire `transpilePackages`. App keeps its design
system in place for now (extraction is Phase 2).
**Verify:** `git log --follow apps/crema-arena/lib/bracket.ts` shows pre-migration history;
`pnpm turbo run build` builds the app; `pnpm --filter crema-arena dev` serves on :3000;
`npx tsc --noEmit` clean.

### Task 4 — New Vercel project + preview smoke test
Create the new Vercel project pointing at `crivelo` repo, Root Directory
`apps/crema-arena`. Replicate all env vars. Deploy to the Vercel-generated URL.
**Verify:** preview deploy is green; against prod DB, login works, `/live/[eventId]`
renders, one photo upload to Blob succeeds.

### Task 5 — Production domain cutover
Move `crema-arena.com` from the old Vercel project to the new one. Keep old project as
rollback.
**Verify:** `crema-arena.com` resolves to the new deploy; production smoke test passes; old
project retained until sign-off, then archived.

### Task 6 — Create `@crivelo/tokens`
Move the Tier-1 foundation out of the app: `globals.css` CSS variables, the Tailwind preset
(`theme.extend`), `public/fonts/*` + a font module, house brand assets. App's
`tailwind.config.ts` consumes the preset; app imports the foundation CSS.
**Verify:** app builds consuming the preset; fonts load (no FOUT/404); Arena renders with
correct typography and neutrals.

### Task 7 — Create `@crivelo/ui`
Move primitives (`Button`, `Card`, `Input`, `Badge`, `Toast`, `ConfirmationModal`, `Modal`,
`LoadingSpinner`, `EmptyState`, `PageHeader`) into `@crivelo/ui`, depending on
`@crivelo/tokens`. Refactor Arena imports (`@/components/*` → `@crivelo/ui`).
**Verify:** `npx tsc --noEmit` clean; `pnpm turbo run build` green; toasts and confirmation
modals work in the running app.

### Task 8 — Cinnamon as Tier-2 override; verify visual parity
Keep the cinnamon accent (`--brand*` vars) as a root override inside `apps/crema-arena`;
ensure Tier-3 personality (brackets, podium, `AO VIVO`, trophy SVGs) stays in the app.
**Verify:** Crema Arena is **visually identical** to pre-migration across dashboard, live
TV (1920×1080), and audience companion — screenshots into `.playwright-mcp/` confirm parity.

## Risks / notes

- **Live prod is the main risk.** Phasing isolates structural change (Phases 1) from
  design-system refactor (Phase 2); the cutover (Tasks 4–5) is reversible by keeping the old
  project until verified.
- **Font loading across the package boundary** is the highest-uncertainty technical bit —
  verify it in Task 6 early.
- **Prisma stays app-local.** `DATABASE_URL` discipline from CLAUDE.md still applies inside
  `apps/crema-arena`; the Prisma CLI reads that app's `.env`.
- This work happens in the **new `crivelo` repo**, so the usual "feature branch off main"
  flow applies within that repo once it exists; the very first scaffold (Task 1) bootstraps
  it.
