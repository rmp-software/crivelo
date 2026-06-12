---
slug: crivelo-web-styling-rework
status: planned
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-208
feature_branch: mux/crivelo-ui-rework-9wtvi
design_link:
design_handoff_local:
---

<feature_specification>

<feature_name>Rework crivelo-web styling: inline styles → Tailwind utilities + full @crivelo/ui kit adoption</feature_name>

<overview>
Follow-up to the RMP-206 consistency migration. crivelo-web migrated to Tailwind v4
(RMP-198) but its components still carry pre-v4 inline-`style={{…}}` / `var(--)`-in-`style`
theming debt, and commodity controls are still hand-rolled. This feature reworks the
**entire `apps/crivelo-web` app** — shell, COA domain, brand, and `app/[locale]/*` — to:

1. Remove all **theming** inline-style debt: convert `style={{…}}` and raw hex to Tailwind
   utility classes (the v4 `@theme` token vocabulary) + `cn()` + token arbitrary values
   (`bg-[var(--bg-2)]`, `text-[var(--fg-3)]`, `bg-brand`, `font-serif`, …).
2. Finish commodity-UI adoption onto `@crivelo/ui`: add a **ToggleGroup** primitive, rebuild
   ThemeControl + LangToggle on it, and route every remaining hand-rolled commodity
   control (links-as-buttons, inputs) through the shared kit — no app-level radix/shadcn
   imports, no primitive duplication.

**Scope decision (supersedes RMP-208's original "keep domain untouched" line):** everything
under `apps/crivelo-web` is in scope, COA included. The ONLY inline styles that survive are
genuinely irreducible **runtime/state-driven** values (computed pixel dimensions, live
transforms, `stroke-dashoffset` animation, TastePad coordinates) and **SVG geometry / brand
asset colors** — each kept with a `// last-resort: …` comment. Brand logos/marks are not
rewritten or regenerated (CLAUDE.md). COA is restyled to be **pixel-identical**, proven by a
Playwright screenshot diff (light + dark) per slice.
</overview>

<surfaces_affected>
- `components/shell/*`: Footer (17 inline styles), ThemeControl (4), LangToggle (4),
  Header (3), Shell (2), icons (1), nav (1), NavSheet (dynamic dot — documented last-resort).
- `components/coa/*`: CoaCalculator (23), BrewTimer (36, ~6 genuinely runtime), TastePad (9),
  PourSchedule (13), RecipeInputs (commodity inputs/steppers), icons (1). ~7 hand-rolled
  `<button>`/`<input>` across these → route commodity ones through `@crivelo/ui`.
- `components/brand/*`: SVG geometry/brand colors stay (documented); wrapper-level theming
  inline styles migrate.
- `app/[locale]/*`: page.tsx, layout.tsx.
- `packages/ui`: new `ToggleGroup` primitive (shadcn toggle-group, themed via the alias layer).
</surfaces_affected>

<acceptance_criteria>
- `grep -rnE "style=\{\{|#[0-9a-fA-F]{3,6}" apps/crivelo-web` → only documented last-resort
  runtime/SVG/brand cases remain (each with a `// last-resort:` comment); no theming-via-inline-style.
- `ToggleGroup` exists in `@crivelo/ui` (export `./toggle-group` + barrel); ThemeControl +
  LangToggle consume it.
- No app-level radix/shadcn-direct imports: `grep -rnE 'from "@?radix-ui"' apps/crivelo-web` = 0.
- Commodity UI consumes `@crivelo/ui` primitives; no primitive duplication; domain (coa runtime
  behavior, brand assets) visually identical.
- `pnpm --filter crivelo-web exec tsc --noEmit` = 0; `pnpm turbo run build --filter crivelo-web`
  succeeds; light + dark themes verified; no visual regression on the COA calculator + shell.
</acceptance_criteria>

<breakdown_sketch>
1. Add ToggleGroup primitive to @crivelo/ui (foundation).
2. ThemeControl → ToggleGroup + utilities.
3. LangToggle → ToggleGroup + utilities.
4. Footer → utilities.
5. Header + Shell + shell/icons + nav + NavSheet dot → utilities.
6. CoaCalculator + RecipeInputs → utilities (commodity controls → kit).
7. BrewTimer → utilities (runtime ring/dashoffset documented).
8. PourSchedule + TastePad + coa/icons → utilities (runtime SVG/coords documented).
9. Brand wrappers + app/[locale]/* + commodity-UI sweep + final whole-app grep-clean gate.
</breakdown_sketch>

<constraints>
- Stays on React 18 (new-york primitives' ref limitation tracked in RMP-207; wrap with a
  forwardRef app-local wrapper where a ref is needed, as the Button wrapper does).
- Tailwind v4: no config file; neutral house tokens (`--bg-2`, `--fg-3`, `--border`) are not
  promoted to named utilities → migrate via arbitrary-value utilities `bg-[var(--bg-2)]`.
  Accent (`bg-brand`, `text-accent-ink`) and fonts (`font-serif`, `font-body`) ARE promoted.
- Apps never import radix/shadcn directly; a new primitive goes in `@crivelo/ui`; an app may
  add a thin forwardRef wrapper that extends a `@crivelo/ui` base.
- Per-slice Playwright screenshot diff (light + dark) — domain pixel-identical is the gate.
- Reference: RMP-196 / RMP-206 (first pass + governance), RMP-205 (crema-arena pattern).
</constraints>

</feature_specification>
