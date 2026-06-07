---
slug: crivelo-design-pull-in
status: planned
created: 2026-06-07
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-143
feature_branch: feature/crivelo-design-pull-in
---

# Crivelo design-system pull-in + Crema Arena re-skin

## Overview

Phase 3 of the Crivelo monorepo work (follows the structure pass, RMP-134). Replace the
*placeholder* contents of `@crivelo/tokens` / `@crivelo/ui` — which today hold Crema Arena's
extracted design system — with the **actual Crivelo house design system** (the neutral-house
brand produced via Claude Design), then re-skin Crema Arena onto it. Crema Arena keeps its
**cinnamon** Tier-2 accent and its Tier-3 personality (brackets, podium, AO VIVO, trophy SVGs).

This is the deliberate visual rebrand the structure pass set up. Phases 1–2 proved the
plumbing renders Arena identically; this phase changes the foundation underneath it.

Design handoff: `https://api.anthropic.com/v1/design/h/M3v1SrSGAYHOSbRFVIzqiA`
Decision record: `apps/crema-arena/docs/crivelo-umbrella.md`

## Problem / motivation

The umbrella plan ("Crema Arena by Crivelo", plus future Mesa/Coa/portal) needs one shared,
neutral house foundation so every product inherits the brand and only swaps its accent. The
monorepo already has the package structure; it just holds Arena's old tokens. Pulling in the
real Crivelo foundation makes the shared layer actually be the house, and is the prerequisite
for any sibling app.

## Divergence audit (handoff vs current `@crivelo/tokens`)

Grounds scope + risk. The handoff `crivelo-design-system/project/colors_and_type.css` vs the
current `packages/tokens/styles/foundation.css`:

**Identical** — crema/espresso neutral hex, the four typefaces, radii (`xs..full`), shadows
(`shadow-1/2`), motion (`ease-*`, `dur-*`). Crivelo's neutral `--brand` = `espresso-900`,
which already matches the RMP-142 neutral default. → Arena's core look is preserved.

**Additive (new in Crivelo)** — `--espresso-950/800/600`, `--crema-400`; spacing scale
(`--space-1..8`); type scale (`--fs-*`, `--lh-*`, `--tracking-*`); `--border-emphasis`,
`--surface-sunken`, `--shadow-inset`; richer element styles (`.display`, `.editorial`,
`.lead`, `.caption`, `.numeric`, link + `::selection`, `font-feature-settings`).

**Removed / renamed from the shared foundation (the migration work)** — `marigold`/`--gold*`/
`--warning*` and `--live*` are **gone**; `mint`→`sage`, `cherry`→`clay` (same hex, renamed).
Crema Arena currently relies on some of these (e.g. gold podium accents, the green AO VIVO/
"live" treatment). They must be retained **app-local** (Tier-2/Tier-3), not in the house.

## Scope

**In scope:**
- Ingest the Crivelo bundle into the monorepo (adapt `design-system-sync` for the monorepo
  layout; the bundle is the house's, so it lives at the repo root, not under `apps/crema-arena`).
- Update `@crivelo/tokens` (`styles/foundation.css` + `tailwind-preset.js`) to the Crivelo
  neutral house: adopt the additive tokens; rename `mint`→`sage`, `cherry`→`clay`; remove
  `marigold`/`gold`/`warning`/`live` from the shared foundation.
- Add Crivelo brand marks (`monogram.svg`, `wordmark.svg`) to the shared layer.
- Reconcile Crema Arena: audit usage of dropped/renamed tokens; retain Arena's full palette
  (cinnamon + gold/marigold + the live-green + any clay/sage usage) as app-local overrides /
  Tailwind aliases so nothing renders undefined.
- **Build the "Crema Arena by Crivelo" endorsement lockup** and place it on Arena's surfaces
  (login, dashboard chrome, podium/credit, audience companion footer — final placements TBD in
  build). Arena keeps its own wordmark/monogram; the "by Crivelo" endorsement is added per the
  naming system.
- **Adopt the Crivelo refinements across Arena** (deliberate visual refresh): the type scale
  (`--fs-*`/`--lh-*`/`--tracking-*`), spacing scale (`--space-*`), and richer element styles
  (`.display`/`.editorial`/`.lead`/`.caption`/`.numeric`, link + `::selection`,
  `font-feature-settings`). Apply to headings, body, mono scores, and the primitives.
- Verify the re-skin across all surfaces (dashboard, live TV 1920×1080, audience companion);
  build + tsc green; PR + preview deploy review before merge to prod.

**Out of scope (explicit cuts):**
- Any sibling app (Mesa, Coa, portal, Léxico, Diário) — structure supports them; not built here.
- The Crivelo **portal homepage** and **brand-voice doc rollout** beyond what Arena needs (they
  ship with the portal, later). The "by Crivelo" lockup itself IS in scope for Arena.

## Surfaces affected

- `.design-system/crivelo-design-system/` — new (ingested bundle; replaces the Arena bundle now
  living under `apps/crema-arena/.design-system/`). TODO: confirm final location + whether to
  move the `crema-arena-design` / `design-system-sync` skills to the repo root.
- `packages/tokens/styles/foundation.css` — modified (Crivelo neutral house values)
- `packages/tokens/tailwind-preset.js` — modified (sage/clay; drop marigold; add scales)
- `packages/tokens/assets/` (or a `@crivelo/brand`) — new (monogram, wordmark)
- `apps/crema-arena/app/accent-cinnamon.css` — modified (retains cinnamon + Arena's app-local
  palette: gold/marigold/live, plus any sage/clay it needs)
- `apps/crema-arena/tailwind.config.ts` — modified (app-local color aliases for retained palette)
- `apps/crema-arena/app/components/*` (Tier-3) — modified only where they reference dropped/
  renamed tokens (e.g. mint→sage, cherry→clay, gold)

## UI / Copy

pt-BR unchanged (this is a visual/token change, not copy). Sentence-case, score `N × M`, etc.
all still apply. The Arena lockup gains a **"by Crivelo"** endorsement (sentence-case, quiet,
secondary to "Crema Arena"). No other new user-facing strings expected.

## Acceptance criteria

- [ ] `@crivelo/tokens` foundation matches the Crivelo handoff `colors_and_type.css` (neutral
      house: no product accent, no marigold/gold/warning/live; sage/clay semantic).
- [ ] Crema Arena builds (`next build`) and type-checks (`tsc --noEmit`) clean; no CSS var
      resolves to undefined (no `var(--gold)`/`var(--marigold-*)`/`var(--live*)` left dangling).
- [ ] Crema Arena renders correctly across dashboard, live TV (1920×1080) and audience
      companion — cinnamon accent intact; podium/AO VIVO/trophy colors intact; screenshots in
      `.playwright-mcp/`.
- [ ] Arena adopts the Crivelo type scale, spacing scale, and element-style refinements; the
      visual refresh is reviewed and signed off on the preview deploy before merge.
- [ ] The "Crema Arena by Crivelo" lockup is present on Arena's surfaces (quiet, sentence-case).
- [ ] Crivelo brand marks are available in the shared layer.

## Risks / open questions

- **Brand-mark co-branding — DECIDED:** Crema Arena keeps its own wordmark/monogram and adds a
  "Crema Arena by Crivelo" endorsement lockup. (Was a decision-record open item.)
- **Re-skin intent — DECIDED:** deliberate visual refresh — adopt the Crivelo type/spacing
  scales + element-style refinements across Arena (not just a token re-home). Larger, more
  user-visible change; gets a careful preview review before prod.
- **Dropped-token reconciliation is the main hazard:** Arena must not render undefined colors.
  Mitigate by auditing `--gold`/`--marigold-*`/`--live*`/`mint`/`cherry` usage first and
  keeping them app-local before swapping the foundation.
- **Skill/bundle relocation:** `design-system-sync` + `crema-arena-design` skills hardcode
  `apps/crema-arena/.design-system` paths; they need updating for the monorepo + Crivelo name.
- Live prod: `main` auto-deploys, so this lands via PR + preview review, with instant-rollback.

## Breakdown sketch

- Ingest Crivelo bundle into the monorepo + relocate/adapt the design skills
- Pre-audit: map Arena's usage of dropped/renamed tokens (gold/marigold/live/mint/cherry)
- Update `@crivelo/tokens` foundation + preset to the Crivelo neutral house (sage/clay, +
  additive tokens, spacing + type scales, element styles)
- Retain Arena's palette app-local (accent-cinnamon.css + app tailwind aliases) so nothing breaks
- Adopt the Crivelo refinements across Arena (apply type/spacing scales + element styles to
  headings, body, mono scores, primitives)
- Crivelo brand marks into the shared layer + build the "Crema Arena by Crivelo" lockup and
  place it on Arena surfaces
- Re-skin verification: screenshots all surfaces, build/tsc, PR + preview review → merge
