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
- `--focus-ring` and `--accent-halo` (crivelo-web): raw-var-only tokens, **intentionally NOT promoted** to
  utilities (documented in `crivelo-theme.css`). Keep `outline-[color:var(--focus-ring)]` arbitrary —
  `outline-focus-ring` is a DEAD class (silently drops the outline). Verify a token is in `@theme` before
  converting; if a `*-theme.css` says "intentionally not promoted", it stays arbitrary.
- Component PROPS that take a CSS color string (`Icon color="var(--fg-3)"` → SVG stroke, `Monogram inkColor`
  → SVG fill): out of scope for the className sweep. Converting needs an Icon/Monogram `className` API change
  (tracked follow-up), not a `[var(--…)]`→utility swap.
- **Composite arbitrary CSS with an embedded token color-stop** — a `var(--token)` nested inside a multi-part
  arbitrary value where no single-token utility exists: `[background:repeating-conic-gradient(var(--crema-50)…var(--espresso-900)…)]`,
  `shadow-[inset_3px_0_0_var(--cinnamon-500)]`, `before:shadow-[0_0_0_4px_var(--bg-inverse)]`. Converting would
  need a raw hex (forbidden) or a bespoke composite `@theme` token; with single uses, they stay documented arbitraries.
- **CSS `animation-*` properties** that reference a token (`style={{ animationDuration: 'var(--dur-stage)' }}` on
  spinners): Tailwind v4 has no `animation-duration` utility (`duration-*` is transition-duration), so the inline
  style stays. Pre-existing; not introduced by the sweep.

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
- 2026-06-12: P1 done + committed (`c8856f3`). 3 @crivelo/ui primitives (empty-state, page-header, spinner)
  swept to bare house utilities; intentional arbitraries (`ring-[3px]`, `animate-[spin_…]`, dialog layout) kept.
  tsc 0, crivelo-web build green, diff value-equivalent (inline review, no merge leakage).
- 2026-06-12: P2 done + committed (`d7d4ea3`). All 14 crivelo-web components (shell/coa/brand) swept in 3 parallel
  batches. Nav family dots: `--dot` bridge → `markerClass` (bg-brand / bg-fg-4); Crema Arena cinnamon rgb kept as
  documented inline exception. Adversarial review found 1 BLOCKER (`outline-focus-ring` was a dead class —
  `--focus-ring` is intentionally NOT a utility; reverted to arbitrary) + 3 exact-match misses (text-14→small,
  text-17→h4, gap-10→2.5) — all fixed. Playwright before/after = pixel-identical (light/dark × mobile/desktop),
  dots correct, focus ring visible, toggles symmetric. **NEW arbitrary-by-design: `--focus-ring`** (and
  `--accent-halo`) — raw-var-only crivelo tokens, intentionally not promoted; keep `[color:var(--focus-ring)]`.
  Out-of-scope deferred: `Icon color="var(--…)"` + `Monogram inkColor` pass token vars as component PROPS
  (→ SVG stroke/fill), not classNames — converting needs an Icon/Monogram `className` API change (follow-up).
- 2026-06-12: Root CLAUDE.md updated with the monorepo-wide "no design-token var() in a className" rule
  (committed with P2 docs). crivelo-web has no app_spec.txt/CLAUDE.md. crema-arena CLAUDE.md + app_spec.txt
  doc updates deferred to the P3 branch (where its code changes). Next: P3 (crema-arena, own branch + PR).
- 2026-06-12: **P3 COMPLETE** on branch `mux/crivelo-ui-rework-crema-arena` (off the P2 branch) → **PR #33**
  (base = P2 branch for a crema-arena-only diff; retarget to main after #32 merges). Commits: 4eafa5e token prep
  (warning + signature shadows), 941f2e5 docs inversion (CLAUDE.md + app_spec.txt + grep compliance rule),
  d5da6ad wave1 (Live/running/landing, 16 files), c8d30a1 wave2 (dashboard/bracket, 19 files), e556797 wave3
  (sponsors/forms/shell-ui, 16 files), 21614ca cleanup (Wordmark + dashboard stat icons inline-style→className).
  **781 className var-arbitraries → 12** (all intentional `--focus-ring`). Irreducible documented exceptions:
  quickLinks alpha-composite, `animation-duration` (no Tailwind utility), composite gradient/inset-shadow with
  embedded token stops. 3 waves of ≤3 parallel coders; per-wave tsc 0 + build green + adversarial review APPROVE
  (caught/fixed: focus-ring dead-class, font-family + exact-match misses, EventStatStrip caller). Playwright
  before/after **pixel-identical** on landing (heaviest) + login (light/dark × mobile/desktop/wide); preview
  token pipeline confirmed resolving. **Open verification gap (environmental, not code):** authenticated
  dashboard pixel-check needs the QA password (preview login is credentials-only) and data-populated live/podium
  screens need a seeded event (dev Neon branch is empty) — both are value-preserving swaps already source-verified
  by the wave reviews (podium gold/crema/cinnamon, EventStatStrip, Wordmark, stat icons).
- 2026-06-12: **Final-gate fixes** (3 independent gates run with the admin login + full-diff reviews). Authenticated
  visual PASS (dashboard Wordmark/stat-icons, EventStatStrip accents, bracket, live TV podium, companion — all
  correct). Adversarial correctness APPROVE. Spec-compliance found + I fixed: (1) **BLOCKER** `outline-[var(--focus-ring)]`
  → `outline-[color:var(--focus-ring)]` in events/page.tsx (without the `color:` hint v4 treats it as the `outline`
  shorthand, so the focus-ring color never applied — a latent bug fix). (2) raw hex `hover:bg-[#9E2F24]` → registered
  house `--danger-hover` (foundation.css + theme.css) → `bg-danger-hover`. (3) composite shadows
  `shadow-[inset_3px_0_0_var(--cinnamon-500)]` / `before:shadow-[0_0_0_4px_var(--bg-inverse)]` → registered
  `shadow-feat-active` / `shadow-timeline-dot` in arena-theme.css. All emit in built CSS; tsc 0, build green.
  Remaining className arbitraries: focus-ring (intentional) + ONE LandingHero conic-gradient QR mock (documented
  composite exception — no clean Tailwind gradient-token path; spec-compliance reviewer did not flag it).
- 2026-06-12: **Follow-up RESOLVED** (separate PR, branch `mux/crivelo-icon-classname-api`). The single-colour brand
  SVGs — `Icon` (already supported it), `Monogram`, `CoaMark` — now render in `currentColor` + take a `className`;
  call sites pass `text-fg-3` / `text-success` / `text-brand` instead of `color="var(--…)"`. CriveloLockup's Monogram
  drops its explicit `inkColor` and inherits the wrapper's `currentColor`. tsc 0, build green, Playwright before/after
  visually transparent. **SieveGrid keeps its `color`/`accent` props by design** — it draws TWO independent colours
  per render (ink + accent) that one `currentColor` can't express; forcing the second onto a className would create a
  `[--accent:var(--…)]` arbitrary (the exact var-in-className this sweep eliminated), so typed colour props are the
  correct API there (a data API, like a chart's colours). Documented in SieveGrid.tsx. Net: crivelo-web prop-level
  vars reduced to the 3 intentional SieveGrid call sites.
