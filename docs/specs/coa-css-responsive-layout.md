---
slug: coa-css-responsive-layout
status: planned
created: 2026-06-20
tracker: local
linear_project_id:  # linear mode only
linear_parent_issue: # linear mode only — RMP-226 is the durable Linear record
feature_branch: feature/coa-css-responsive-layout
---

# Coa: CSS-driven responsive layout — drop `useViewport`

Linear: [RMP-226](https://linear.app/rmp-tech/issue/RMP-226)

## Context

On desktop, the first cold load of the Coa calculator briefly shows the mobile
single-column layout, then snaps to the two-column desktop layout — a visible
flash on every cold load.

**Root cause.** `apps/crivelo-web/components/coa/useViewport.ts` decides the
layout in JavaScript. It deliberately returns `"mobile"` on the server + first
client render (to keep hydration deterministic), then measures
`window.innerWidth` in a post-mount `useEffect` and switches. So on desktop:
SSR renders mobile → first paint mobile → effect runs → switches to desktop. The
post-mount switch is the flash. `CoaCalculator` reads `wide = bp !== "mobile"`,
and the breakpoint also feeds measured-looking pixel values:

- `PAD_DIMS[bp]` — the `TastePad`'s numeric canvas dimensions.
- `CONTAINER_MAX[bp]` — the wide container's inline `max-width`.
- the `BrewTimer` ring size (`SZ = wide ? 272 : 236`).
- assorted padding / gap / font-size class choices.

This is **pre-existing** (RMP-191, ported from the design prototype), independent
of the save-recipes feature; the save-recipes bottom-bar / inline work merely
rides the same `wide` signal.

**Key finding from reading the code.** None of those values are genuinely
*measured*. They are fixed per-breakpoint constants, so Tailwind responsive
utilities (`md:` / `lg:`) express them directly and `useViewport` can be deleted
outright:

- The pad is already `w-full` (fills its column). Its `w` is only a mobile
  max-width cap, redundant with the page container's own `max-w` + padding.
- The pad's `h` is a fixed per-breakpoint constant (280 / 300 / 350).
- With `stretch` + `preserveAspectRatio="none"`, `SieveGrid`'s `gap` only sets
  the SVG viewBox coordinate system; the puck neighbourhood math is normalized
  (0..1), so `gap` has negligible visual effect and collapses to one constant.
- The ring uses a `viewBox`, so a fixed coordinate space scaled by a responsive
  rendered width reproduces both ring sizes with the geometry math unchanged.

The only flash-free **and** hydration-mismatch-free approach is a CSS-driven
responsive layout: one markup tree, Tailwind breakpoints pick the arrangement,
correct on first paint at any width, no JS measurement for layout.

## Decisions (settled in scoping)

- **Breakpoints:** standard Tailwind `md` = 768 / `lg` = 1024 (NOT a custom 700px
  token). `useViewport` flipped mobile→wide at 700; the standard `md` is 768. Net
  behavior change: screens 700–767px wide now render the single-column layout
  instead of the cramped two-column tablet layout (768 gives roomier columns).
  Desktop ≥ 1024 is unchanged (exact match to `lg`).
- **TastePad sizing:** pure Tailwind responsive utilities — no ResizeObserver, no
  container queries, no JS measurement.
- **Scope:** drop `useViewport` entirely; migrate all three consumers
  (`CoaCalculator`, `BrewView`, `BrewTimer`) in this feature.

## Approach — one markup tree, breakpoints pick the arrangement

1. **`components/coa/CoaCalculator.tsx`** — collapse the two `wide`-gated
   `return`s into a single tree using `lg:grid lg:grid-cols-2` + responsive
   ordering (mobile single column: intro → pad → inputs → schedule → CTA; `lg`
   two columns: left intro + pad + inputs, right sticky recipe panel). Replace the
   `CONTAINER_MAX` inline `max-width` with responsive `max-w-*` classes. Convert
   per-breakpoint padding / gap / intro-font choices to `md:` / `lg:` utilities.
   The wide-only panel header and the inline-vs-bar `LastBrewBar` selection ride
   the same breakpoints — render both variants and toggle visibility with
   `hidden` / `lg:block` (and the reverse) rather than a JS branch.

2. **`components/coa/TastePad.tsx`** — drop the `dims` and `center` props. Height
   becomes `h-[280px] md:h-[300px] lg:h-[350px]`; width stays `w-full`; the mobile
   max-width cap is removed; `SieveGrid` receives a single constant `gap`. No JS,
   no ResizeObserver. The puck-position custom properties (runtime drag state)
   stay — they are a legitimate runtime bridge, not a breakpoint value.

3. **`components/coa/BrewView.tsx`** — remove the `useViewport` call and stop
   passing the `bp` prop to `BrewTimer`.

4. **`components/coa/BrewTimer.tsx`** — derive `wide` / `desktop` from Tailwind
   breakpoints instead of the `bp` prop. The ring keeps a **fixed viewBox** (the
   272 coordinate space; `R` / `CX` / `CIRC` / `strokeDashoffset` math unchanged)
   and the rendered box scales via responsive width utilities
   (`w-[236px] lg:w-[272px]`, height matching). The two-column grid layout,
   container max-width, and the ring-clock / center font sizes become responsive
   utilities. The live ring fill / progress remain runtime inline-style bridges.

5. **Delete `components/coa/useViewport.ts`** and its `Breakpoint` type / exports
   once no consumer remains; update `components/coa/index.ts` re-exports.

Follow the monorepo styling rules: Tailwind v4 utility-first, tokens as the
vocabulary, no design-token `var(--…)` in a className; `env()` / runtime-computed
custom properties remain legitimate runtime bridges.

## Acceptance criteria

- [ ] Given a cold (throttled) load at desktop (1280) and tablet (768) widths,
      when the calculator first paints, then it shows the correct layout with no
      mobile→desktop flash (verify with screenshot/video at 1280, 768, 393).
- [ ] Given a fresh load on any breakpoint, when the page hydrates, then there are
      no hydration errors in the console.
- [ ] Given the home (`/`), `/brew`, and `/recipes` routes, when each loads, then
      no layout shift is introduced (CLS ≈ 0).
- [ ] Given any breakpoint, when the taste pad renders, then it is at the correct
      size with no JS breakpoint switch (it sizes from its container + responsive
      utilities).
- [ ] Given the final diff, when `useViewport` consumers are audited, then
      `useViewport` is removed entirely (no remaining consumer; the file and its
      `Breakpoint` export are deleted).
- [ ] Given a saved last-brew, when the home renders narrow vs wide, then the
      bottom-bar (narrow) vs compact-inline (wide) selection is still correct,
      driven by the same CSS strategy.
- [ ] Given a real device / resized browser window, when sweeping across
      breakpoints, then the layout is correct (not just headless verification).

## Verification

- `pnpm --filter crivelo-web type-check` exits 0 (per repo CLAUDE.md, Node 24).
- Boot `next dev` (never alongside `next build`). Drive Playwright / Chrome across
  1280 / 768 / 393:
  - Throttled cold-load capture on `/` — confirm the first paint is already the
    correct layout (no flash) at desktop + tablet.
  - Console clean — no hydration mismatch on any breakpoint.
  - CLS ≈ 0 on `/`, `/brew`, `/recipes`.
  - TastePad sized correctly at each breakpoint.
  - Save-recipes bar-vs-inline correct narrow vs wide.
- A real resized-window / device pass across breakpoints (headless is not enough
  for UI per repo conventions).

## Out of scope / notes

- No change to the 4:6 recipe engine, the brew session/timer logic, or the
  save-recipes data flow — only how the same `wide`/`bp` signal is derived
  (CSS instead of JS).
- Surfaced while reviewing the save-recipes home redesign (PR #55); independent of
  that feature.

## Tasks

- [ ] TastePad — propless responsive sizing
  - AC: the taste pad renders at the correct size on all breakpoints with no JS
    breakpoint switch (sizes from its container + responsive utilities).
  - Test: 1. `pnpm --filter crivelo-web type-check` exits 0. 2. Load `/` at 393 /
    768 / 1280; screenshot the pad at each — height 280 / 300 / 350, fills its
    column. 3. Drag the puck — it still tracks acidity/strength. Drop the
    `dims` / `center` props; height `h-[280px] md:h-[300px] lg:h-[350px]`; width
    stays `w-full`; remove the mobile max-width cap; `SieveGrid` gets one constant
    `gap`.

- [ ] CoaCalculator — single CSS-driven markup tree
  - AC: cold (throttled) load at 1280 / 768 / 393 paints the correct layout on
    first paint with no mobile→desktop flash; no hydration error; CLS ≈ 0 on the
    home route; save-recipes bottom-bar (narrow) vs compact-inline (wide) still
    correct.
  - Test: 1. `type-check` exits 0. 2. Throttled cold load at 1280 and 768 — the
    first paint is already the correct (two-column / single-column) layout, no
    flash. 3. Console clean (no hydration mismatch). 4. Seed a last-brew; confirm
    the bottom-bar shows narrow and the compact-inline row shows wide. Collapse the
    two `wide`-gated returns into one `lg:grid lg:grid-cols-2` tree; `CONTAINER_MAX`
    → responsive `max-w-*`; padding/gap/intro-font → `md:` / `lg:`; consume the new
    propless TastePad; no `useViewport` here.

- [ ] BrewView + BrewTimer — drop `bp`, breakpoint-driven brew screens
  - AC: `/brew` paints the correct layout on first paint with no flash; no
    hydration error; CLS ≈ 0; the ring renders at the correct size at each
    breakpoint.
  - Test: 1. `type-check` exits 0. 2. Cold load `/brew` at 1280 / 768 / 393;
    screenshot — ring sized correctly (fixed viewBox scaled by responsive width),
    grid/fonts correct. 3. Console clean. BrewView stops calling `useViewport` /
    passing `bp`; BrewTimer derives `wide` / `desktop` from breakpoints.

- [ ] Delete `useViewport` + cleanup + whole-app gate
  - AC: `useViewport` is removed entirely (no remaining consumer; file + `Breakpoint`
    export deleted); CLS ≈ 0 on `/`, `/brew`, `/recipes`; verified on a real resized
    window across breakpoints.
  - Test: 1. `grep -rn useViewport apps/crivelo-web` → no hits. 2. Delete
    `components/coa/useViewport.ts` + its `Breakpoint` type; update
    `components/coa/index.ts` re-exports. 3. `type-check` exits 0. 4. Full Playwright
    sweep at 1280 / 768 / 393 across all three routes (no flash, console clean,
    CLS ≈ 0). 5. A real resized-window pass across breakpoints.

- [ ] Follow-up: audit app-wide JS-powered responsiveness & decide
  - AC: every JS-driven responsiveness usage in `apps/crivelo-web` outside the COA
    components is catalogued (any `window.innerWidth` / `matchMedia` / `resize`
    listeners / viewport hooks); for each, a decision is recorded — migrate to CSS
    breakpoints now (if cheap + in scope) or keep with a one-line justification /
    file a follow-up. The goal is to remove JS-powered responsiveness app-wide
    where a CSS equivalent is flash-free.
  - Test: 1. `grep -rnE 'innerWidth|matchMedia|addEventListener\(.?resize|useViewport|useMediaQuery' apps/crivelo-web`
    → produce the catalogue. 2. Record the per-finding decision in this spec (a
    `## App-wide responsiveness audit` section) or as follow-up tasks. 3. Any
    migrations done in this pass meet the same flash-free / no-hydration-error /
    CLS ≈ 0 bar as the COA work.
