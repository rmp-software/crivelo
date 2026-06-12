---
slug: tailwind-clean-slate
status: in-progress
branch: mux/crivelo-ui-rework-9wtvi
parent_pr: 32
created: 2026-06-12
---

# Tailwind v4 Clean-Slate Refactor — monorepo arbitrary-value elimination

**Resume anchor.** This doc is the single source of truth for the in-flight idiomatic-Tailwind
sweep. After a context compaction, read THIS file + run the audit greps below to resume.

## Goal
Eliminate arbitrary `[var(--…)]` / `[color:var(--…)]` / off-scale `[NNpx]` utilities monorepo-wide
in favor of registered `@theme` token utilities + the standard spacing scale. Keep arbitrary values
ONLY for genuinely continuous runtime values. End-state: **no design-token `var()` in any className.**

## Decisions (locked — do not relitigate)
1. **Vocabulary rule:** app/component code uses the **HOUSE** neutral utilities (`bg-bg-2`, `text-fg-3`,
   `bg-surface`, `border-border-strong`). The shadcn `--color-*` aliases in `packages/ui/src/styles/shadcn-theme.css`
   stay **internal to `packages/ui/src/ui/**`** only — app code never uses `bg-background`/`text-muted-foreground`.
2. **Token home = foundation.** Semantic neutrals promoted in `packages/tokens/styles/theme.css` (DONE, P0).
   Per-app accent stays app-local (`arena-theme.css`, `crivelo-theme.css`).
3. **Pixel fidelity = snap-to-scale.** Even-px → exact scale step (no visual change). Genuinely off-scale
   values snap to nearest step (≤1px shift OK). Colors + even-spacing are pixel-exact.
4. **Typography (OQ1 = "register scale, snap exact only"):** named sizes registered as `--text-*` (DONE, P0).
   Swap call sites that match a named size **exactly** → `text-h3`/`text-body`/etc. Leave off-scale sizes
   (10/11/11.5/13/13.5/18/19/22px…) as documented `text-[NNpx]` arbitraries.
5. **Runtime bridges:** keep an inline-style CSS var ONLY where the value is a continuous JS number
   (drag coords, animation offset, measured/`%`/`clamp()` dims, computed `rgba()`). Where an inline-style
   var carries a FINITE enumerable set → convert to a static className lookup (`Record<key, "bg-brand"|…>`).
6. **OQ2 (taken):** the one Crema-Arena nav-dot rgb literal stays a documented inline-style exception.
7. **OQ3 (taken):** EXCLUDE `@crivelo/ui/deprecated/*` from the sweep (slated for removal).
8. **PR strategy:** P0+P1+P2 land on this branch (PR #32). **P3 (crema-arena) = its own branch off this one
   → its own PR** (crema-arena is a separate Vercel project, auto-deploys to prod on merge to main).

## What stays arbitrary BY DESIGN (do NOT force onto a scale)
- Border widths with no scale step: `border-[1.5px]`, `border-[3px]`. (`border`=1px, `border-2`, `border-4`, `border-8` only.)
- `ring-[3px]` (v4 `ring` default = 1px; intentional 3px focus ring).
- Small radii with no token: `rounded-[4px]` (house radii: xs6/sm10/md18/lg28/full999).
- Container / max-width layout one-offs: `max-w-[1200px]`, `max-[960px]`, etc. — continuous layout values.
- Off-scale font sizes (see Decision 4).
- PWA manifest hex (`apps/crivelo-web/app/pwa.config.tsx`) — OS-consumed literal.

## Token registry (P0 — DONE, committed)
`packages/tokens/styles/theme.css` now promotes (additive):
- House neutrals: `--color-bg/-bg-2/-bg-3/-bg-inverse/-surface/-surface-raised/-surface-sunken`,
  `--color-fg/-fg-2/-fg-3/-fg-4/-fg-muted/-fg-inverse`, `--color-border-strong/-border-emphasis`.
  (NOT `--color-border` — owned by shadcn-theme.css; `border-border` already works.)
- Semantic accents: `--color-brand/-brand-hover/-brand-press/-brand-soft`, `--color-success/-success-soft/-danger/-danger-soft`.
- Type scale: `--text-display/-h1/-h2/-h3/-h4/-body/-small/-caption(=fs-xs)/-mono-lg/-mono`.
Existing already: palette (`espresso/crema/sage/clay`), `--color-cinnamon/marigold/gold/mint/live/cherry` (arena),
`--color-brand*/accent-*` (crivelo-theme — now redundant with foundation; optional cleanup), radii/shadow/ease/duration.

### Per-app token additions still TODO
- `apps/crema-arena/app/arena-theme.css` (do in P3): add `--color-warning: var(--warning); --color-warning-soft: var(--warning-soft);`
  and `--shadow-live-halo: var(--shadow-live-halo); --shadow-telona: var(--shadow-telona);` (all defined in arena-tokens.css).
- `apps/crivelo-web/app/crivelo-theme.css` (optional): remove redundant `--color-brand*` (now in foundation). Low priority.

## Transform table (mechanical, applied by coders)
| Pattern | Replace with |
|---|---|
| `text-[color:var(--X)]`, `text-[var(--X)]` | `text-X` |
| `bg-[var(--X)]` | `bg-X` |
| `border-[var(--X)]`, `border-t-[var(--X)]`, `divide-[var(--X)]` | `border-X` / `border-t-X` / `divide-X` |
| `ring-[var(--X)]`, `outline-[var(--X)]` | `ring-X` / `outline-X` |
| `rounded-[var(--radius-Y)]` | `rounded-Y` |
| `shadow-[var(--shadow-N)]` | `shadow-N` |
| `duration-[var(--dur-Z)]` | `duration-Z` (e.g. `duration-stage`) |
| `ease-[var(--ease-W)]` | `ease-W` (e.g. `ease-standard`) |
| `font-[family-name:var(--font-mono)]` | `font-mono` |
| even-px spacing `gap-[14px]`/`mb-[22px]`/`p-[10px]` | scale step `gap-3.5`/`mb-5.5`/`p-2.5` (Tailwind v4 spacing base 0.25rem → 1px granularity via .25/.5 steps) |
| `text-[16px]`/`[20px]`/`[17px]`/`[14px]`/`[12px]`/`[15px]` | `text-body`/`text-h3`/`text-h4`/`text-small`/`text-caption`/`text-mono` (exact only) |
| static `style={{ color:'var(--brand)' }}` / `style={{ background:'var(--espresso-900)' }}` | `className="text-brand"` / `bg-espresso-900` (drop the style) |
Where `--X` maps to a registered token name (drop the `--`). Class strings MUST be literal (Tailwind JIT).

## Finite-set bridge → static map (remove the var)
- crivelo-web `components/shell/nav.ts` + `NavSheet.tsx`/`Footer.tsx`: the `--dot` bridge. Add `markerClass`
  to nav data (`"bg-brand" | "bg-fg-4"`); keep the lone Crema-Arena external-rgb dot as documented exception (OQ2).
- crema-arena `Wordmark.tsx`, `EventStatStrip.tsx`, `NowPouring.tsx`: static `color/background: var(--…)` → className.
  Inspect props; if finite enum → `Record<>` lookup, else keep.

## Runtime bridges to KEEP (continuous — do NOT touch the var)
- crivelo-web: `TastePad.tsx` (`--puck-x/-y`, measured pad dims), `BrewTimer.tsx` (ring stroke-dashoffset, `--mw`),
  `PourSchedule.tsx` (`--flex`, `--bar` continuous-alpha rgba), `CoaCalculator.tsx` (computed container width).
- crema-arena: `LiveDisplay.tsx`, `LiveStage.tsx`, `LiveCompanion.tsx`, `CrowdVoteBar.tsx` (`width:${pct}%`),
  `SponsorStrip.tsx`, `NowPouring.tsx` (computed parts) — keep `%`/`clamp()`/computed-geometry; convert only static color vars.

## Phases / batches (≤3 concurrent coders, disjoint files, edit-only: no dev server, no commit)
- **P0 — tokens** ✅ DONE + committed (`packages/tokens/styles/theme.css`).
- **P1 — `packages/ui`** (do FIRST after P0; highest blast radius, both apps consume it). ~7 files:
  `src/ui/{empty-state,button,toggle,spinner,badge,input,page-header}.tsx` (22 var + keep `ring-[3px]`). One batch.
- **P2 — crivelo-web** (~13 files, 3 batches): 2a-i shell `{Header,Shell,LangToggle,ThemeControl}.tsx`;
  2a-ii `{NavSheet,Footer}.tsx`+`nav.ts` (dot map); 2b `{CoaCalculator,PourSchedule,RecipeInputs}.tsx`;
  2c `{BrewTimer,TastePad,CoaLockup,CriveloLockup}.tsx`. Extends PR #32.
- **P3 — crema-arena** (~59 files, ~8 batches; OWN branch+PR): slice by surface — Live TV, Live companion,
  podium/sponsors, brand, dashboard pages, forms, then the bulk pure-className components. ~1,490 color swaps.

## Documentation updates (REQUIRED — the convention is changing)
crema-arena `CLAUDE.md` currently documents `bg-[var(--espresso-800)]` for "raw ramp steps" — the sweep
inverts this. Update to "use bare token utilities (`bg-espresso-800`, `text-fg-3`); arbitrary only for
runtime/off-scale one-offs." Update BOTH apps' `CLAUDE.md` + `app_spec.txt` `<styling_conventions>` /
`<compliance_rules>` so the spec-compliance reviewer enforces the NEW rule (and forbids `bg-[var(--token)]`
where a bare utility exists, and forbids `bg-background`/`text-muted-foreground` in app code). Also root `CLAUDE.md`.

## Tooling (local-first per user; rmp: only for gaps)
- Coder: **`code-refactor-master`** agent, guided by `.claude/skills/tailwindcss` + `turborepo`. Edit-only, ≤3 concurrent, disjoint files.
- Review: **`code-architecture-reviewer`** (per slice) + **`principal-engineer`** (token/arch). `code-review` command.
- Fix: `auto-error-resolver` / `build-and-fix`.
- Visual verify: general-purpose subagent w/ Playwright (no local agent covers it).

## Verification gate (every batch)
1. `pnpm --filter <pkg> exec tsc --noEmit` = 0.
2. `pnpm turbo run build --filter <pkg>` succeeds (catches Tailwind purge of non-literal classes).
3. Playwright screenshot diff vs PRISTINE baselines (capture per app BEFORE sweeping that app), light+dark,
   per breakpoint (crema-arena TV = 1920×1080; companion = mobile; dashboard = desktop). ≤1px tolerance.
4. Reviewer: no leaked tailwind-merge defaults; no continuous runtime bridge converted; no copy/behavior change.
- crema-arena note: needs DB/Prisma env for full build/SSG — may need `prisma generate`; verify via dev server + Playwright if build is env-blocked.

## Audit greps (run to re-scope after compaction)
```
grep -rnE '\[color:var\(--|-\[var\(--' apps packages --include=*.tsx --include=*.ts | grep -v node_modules | wc -l
grep -rnE 'style=\{\{' apps packages --include=*.tsx | grep -v node_modules
grep -rnE 'from "@?radix-ui"' apps --include=*.tsx   # must stay 0 in app code
```

## Status log
- 2026-06-12: P0 done (foundation @theme token + type-scale promotion); crivelo-web build green. Next: P1 (packages/ui).
