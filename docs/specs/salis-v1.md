---
slug: salis-v1
status: planned
created: 2026-11-02
tracker: linear
linear_project_id: 2174444f-c5b2-4b22-ae0c-3f9a3c527684   # Salis project (NOT the .linear_features.json default, which is Crema Arena)
linear_parent_issue: RMP-246
feature_branch: feature/salis-v1
design_link: https://claude.ai/code/artifact/12e7b5fe-e36f-46ef-ab1e-2497aa1fd02d
design_handoff_local: apps/salis/.design/   # gitignored — NOT committed; pull from the design system's live link
---

# Salis — v1 (closed beta for Juliana's turmas)

Mobile-first, offline-capable PWA for **water mineralization for specialty
coffee**, built with **Juliana** (who teaches the course) for her students.
Latin for "of salt" — Brazilians call brewing minerals *sais*.

## Source of truth

This spec is the harness entry point. The design itself was produced in a
Claude Docs dialogue and lives, in full, in the app:

| Document | What it holds |
| --- | --- |
| `apps/salis/docs/01-v1-plan.md` | **The spec.** Journey, screens S0–S6, calculation rules, scope, build order. Where anything disagrees, this wins. |
| `apps/salis/docs/03-content-schema.md` | What Juliana fills, and the JSON the app consumes |
| `apps/salis/docs/02-research-ux-flow.md` | Chemistry, market comparison, sources. Reference only; superseded by 01 on display unit, base water, espresso badge and concentrate ion yield |
| `apps/salis/docs/phase-1-report.md` | What Phase 1 proved, and the three findings for Juliana |
| `apps/salis/.design/` | Claude Design handoff — gitignored, tokens already translated into `@salis/tokens` |

Linked design artifacts: the [v1 plan](https://claude.ai/code/artifact/12e7b5fe-e36f-46ef-ab1e-2497aa1fd02d)
and the [UX flow & wireframes](https://claude.ai/code/artifact/8222c968-b4c7-4557-a502-a1ac6c641fe9).
**TODO:** record the Salis Design System's live `claude.ai/design` link here —
the bundle was delivered as a zip, so the retrievable source is not yet captured.

## The one thing v1 is measured by

> A student who finished the course makes correct water at home without
> messaging Juliana.

No payments, no accounts, no admin UI, no interactive plane.

## Principles that decide ties

1. **The first job is preparing concentrates, not picking recipes.** An empty
   inventory routes to the prep recipe that unlocks the most presets.
2. **Drops are the unit; everything else is on tap.** GH/KH as CaCO₃ is the one
   summary line. Ion mg/L behind a tap. Never show ppm-of-salt.
3. **Juliana's judgement over any formula.** Her override always wins.
4. **Never block a brew.** A missing concentrate dims a row; it never hides the
   recipe or its drop counts.
5. **Built for wet hands.** Large numbers, tappable rows, screen stays awake,
   nothing important below the fold at 390 px.
6. **Honest about uncertainty.** Where the literature disagrees, follow
   Juliana's coordinates and say in *Aprender* that the field is not settled.

## Build order (strict — each phase ends at a gate, not a date)

| Phase | Delivers | Gate |
| --- | --- | --- |
| **1 · Conteúdo e motor** | Content template, importer, pure dosing engine, tests | Drops match Juliana's spreadsheet |
| **2 · Loop principal** | Onboarding, S1–S5, inventory, offline, modo preparo | 3 students make water unaided |
| **3 · Camadas** | In-row substitution, base-water chip, plane, espresso badge, S6, Aprender | Juliana approves every screen and string |
| **4 · Beta com a turma** | Turma link, events, weekly call, fixes | 70% made water in week 2 |

**Phase 1 is complete** (see `phase-1-report.md`): 117 tests pass, reproducing
the plan's worked example, Barista Hustle within 1%, Rao/Perger within 5%, and
"Mais doce" at 10 · 17 · 20 gotas / GH 124 · KH 25. Its **gate is not yet
passed** — that requires Juliana's own spreadsheet, which is blocked on the open
questions below.

## Stack

An app in this monorepo on the Crivelo stack — Next 16, React 19, Tailwind v4,
shadcn via `@crivelo/ui`, Vitest. `@salis/tokens` replaces `@crivelo/tokens` at
Tier 1 (cool teal/slate, dark theme, Source Sans 3 + IBM Plex Mono). Offline via
`@crivelo/pwa`. No backend: static content JSON plus device-local state.

## Acceptance criteria

### Engine and content (Phase 1 — done)

- [x] Given a mineral's full hydrate formula, when content is imported, then molar mass and ion mass fractions are derived from it and no fraction is hand-entered
- [x] Given 49,2 g KHCO₃ in 1.000 mL and a 30 mg/L HCO₃ target for 1 L at 20 gotas/mL, when the recipe is computed, then it doses exactly 20 gotas
- [x] Given the published Barista Hustle stocks, when hardness is computed, then GH and KH land within 1% of 1.000 ppm
- [x] Given Rao/Perger's 25 g Epsom + 8,6 g NaHCO₃ in 500 mL at 1:200, when computed, then GH ≈ 100 and KH ≈ 50 within 5%
- [x] Given a base water richer than a target, when computed, then the row doses zero, is flagged "já presente", and the summary reports the real total
- [x] Given a sheet with a dangling reference, a bad enum, an unparseable formula or a missing guard key, when imported, then every problem is reported at once and no JSON is written
- [ ] Given Juliana's own spreadsheet, when imported and computed, then our drop counts match hers **(gate — blocked on open questions 1 and 2)**

### Onboarding and inventory (Phase 2)

- [ ] Given a first launch, when the user completes onboarding, then their owned concentrates and gotas/mL are stored on device
- [ ] Given onboarding finishes with an empty inventory, when the last screen shows, then it routes to the prep recipe for the concentrate that unlocks the most presets
- [ ] Given a concentrate's prep screen, when the user taps "Tenho este concentrado", then every recipe row using it becomes active without recomputing
- [ ] Given a changed gotas/mL setting, when the user returns to any recipe, then all drop counts recompute and the change is announced once

### The core loop (Phase 2)

- [ ] Given the recipe list, when it renders, then each card leads with its sensory name and promise, shows GH/KH, and shows how many concentrates the user lacks
- [ ] Given a recipe and a water amount, when the amount changes, then drop counts rescale and the GH/KH line does not
- [ ] Given a recipe row under 3 drops or over 60, when it renders, then mL leads instead of drops, and over 60 is flagged
- [ ] Given a missing concentrate, when the recipe renders, then the row is dimmed but still shows its drop count, and the recipe is never hidden
- [ ] Given modo preparo, when the user doses each tile, then it ticks, the screen stays awake, and bicarbonate is last
- [ ] Given no network after first load, when the user opens any recipe, then the calculator works fully offline

### Layers (Phase 3)

- [ ] Given a missing concentrate and an owned equivalent, when the row renders, then it offers the swap in place with Juliana's one-line note, and the recipe is marked "com substituição"
- [ ] Given a substitution that swaps KHCO₃ for NaHCO₃, when applied, then KH is unchanged and sodium appears in the ion sheet
- [ ] Given a bottled base-water profile is selected, when the recipe recomputes, then each row doses only the shortfall
- [ ] Given a recipe whose concentrates include a chloride, when it renders, then it never shows the *espresso ok* badge regardless of Juliana's flag
- [ ] Given Juliana supplied plane coordinates for a recipe, when the plane renders, then her values are used and the formula is not
- [ ] Given a guard threshold is crossed, when the recipe renders, then the matching warning appears in Juliana's Portuguese
- [ ] Given the Aprender tab, when it renders, then it lists her lessons from content, in order

### Beta (Phase 4)

- [ ] Given a turma code, when a student opens the link, then they reach the app with state stored on device only
- [ ] Given a student uses the app, when they open a recipe, complete modo preparo, mark a concentrate or use a substitution, then that event is recorded

## Open questions

The first two block Phase 1's gate; the rest can be answered while Phase 2 runs.

- [ ] **Concentrate convention.** Is "30.000 ppm" ppm of the ion or of the salt? Same bottle, 1,6× different drop counts. The engine tracks both through `salt_g`, so the answer moves test fixtures, never code.
- [ ] **Dropper.** Does the course ship or name a conta-gotas? If yes, fix `v_gota` and drop the calibration screen.
- [ ] **Gypsum.** CaSO₄·2H₂O is ~50× too insoluble to be a 30.000 ppm concentrate, which leaves the espresso-safe CaCl₂ → CaSO₄ substitution with no bottle behind it. Weigh it directly, ship a weak stock, or drop the rule?
- [ ] **The plane formula contradicts "Mais doce".** Its own published numbers put it at x = +0,86 (brilhante). Revisit the targets, the constants, or place presets by hand?
- [ ] Presets for launch, substitution rules, bottled-water profiles, and her real guard thresholds.
- [ ] Warning copy: the engine emits codes; Phase 2 owns the code → pt-BR mapping, reviewed by Juliana in Phase 3.
- [ ] Access: turma code with device-only state, or does she need to see who is using it?

## Known constraints

- **UI strings pt-BR; everything else English.** Teacher's voice, sentence case, no emoji, no diminutives, pt-BR number formats.
- **`@crivelo/pwa`'s offline half assumes locale-prefixed routing.** Salis is single-locale, so `createServiceWorker({ locales: [] })` emits no fallback at all. Fix in the package (per the root CLAUDE.md shared-package rule), not app-side, when Phase 2 wires offline.
- **The design handoff's chemistry must not be ported** — it hand-types ion fractions from the anhydrous formulas. Visual truth from the handoff, numeric truth from `docs/01` + `docs/03`.
