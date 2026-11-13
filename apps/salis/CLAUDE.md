# CLAUDE.md — Salis

Mobile-first, offline-capable PWA for **water mineralization for specialty
coffee**. Built with **Juliana**, who teaches the course; the users are her
students. The name is Latin for "of salt" — Brazilians call brewing minerals
*sais*.

v1 is a closed beta for her first *turmas*, measured by one thing: **a student
who finished the course makes correct water at home without messaging Juliana.**

## Read first, in this order

1. `docs/01-v1-plan.md` — **this is the spec.** What v1 is, the user journey,
   screens S0–S6, calculation rules, scope, build order.
2. `docs/03-content-schema.md` — the entities Juliana fills and the JSON the app
   consumes.
3. `docs/02-research-ux-flow.md` — chemistry, market comparison, sources.
   Reference only; **where it disagrees with 01, 01 wins.** It predates the plan
   and is superseded on display unit, base water, espresso badge and concentrate
   ion yield.
4. `.design/` — the Claude Design handoff (gitignored, pulled from the
   `design_link` in the feature spec). Every visual decision comes from here;
   its tokens are already translated into `@salis/tokens`.

## Non-negotiables (from the plan)

- **Phase order is strict.** Phase 1 = content template + import + pure dosing
  engine + tests. **No UI until the engine reproduces Juliana's spreadsheet and
  the published reference recipes.** See "Build order" in `docs/01`.
- **Drops (gotas) are the primary unit.** The hero number is drops for the water
  volume on screen. GH/KH as CaCO₃ is the one summary line. Ion mg/L lives behind
  a tap. **Never show ppm-of-salt to the user.**
- **Juliana's content is data, not code.** Presets, concentrates, minerals,
  equivalence rules, base waters, guards and lessons come from `content/*.json`,
  generated from her spreadsheet by `scripts/import-content`. **Never hardcode a
  recipe in a component.**
- **Never block a brew.** A missing concentrate dims a row; it never hides the
  recipe or its drop counts.
- **Juliana's override wins.** Plane coordinates, sensory notes, espresso-safe
  flags: if her value is present, the formula is not used.
- **Hydrate forms are explicit.** Every mineral carries its full formula (e.g.
  `MgSO4·7H2O`) and ion mass fractions are **derived from that formula, never
  typed by hand** — hydrate confusion is a up-to-2× dosing error.
- **Offline-first.** The calculator must work with no network after first load.

## Dosing formula (single source of truth — see `docs/01` § Calculation rules)

```
gotas = (C_alvo − C_base) [mg/L] × V [L] / y [mg de íon por gota]
y     = (m_sal [g] × f_íon × 1000 / V_conc [mL]) × v_gota [mL]
```

Defaults: `v_gota = 0.05 mL` (20 gotas/mL), overridable per device. Round to the
nearest whole drop; <3 drops → show mL first; >60 drops → show mL first and flag.

GH (as CaCO₃) = Ca × 2.497 + Mg × 4.118. KH (as CaCO₃) = HCO₃ × 0.820.

Plane: `x = clamp((0.5 − KH/GH)/0.35 − Na/80 + 0.3·(CaShare − 0.5), −1, 1)`,
`y = clamp((GH − 80)/80, −1, 1)`.

## Two open questions block the engine's numeric tests

1. **Is Juliana's "30.000 ppm" concentrate ppm of the ion or of the salt?** Same
   bottle, 1.6× different drop counts. Mitigated by design: a concentrate stores
   `m_sal`, `V_conc` and the mineral, and derives the rest — so the answer
   changes test fixtures, never code.
2. **Does the course standardise a dropper?** If yes, hardcode `v_gota`; if no,
   keep the onboarding calibration screen.

Until answered, test against the Barista Hustle and Rao/Perger recipes in
`docs/02` (their grams and ppm are published) and mark Juliana-dependent fixtures
`test.todo` with a comment naming the open question.

## The design handoff's chemistry is NOT the spec

`.design/` ships working chemistry helpers (`components/data/Formula.jsx`,
`ui_kits/app/data.js`) and its own README says to validate them. They contradict
the spec and **must not be ported**:

- `MINERALS` carries **hand-typed `ionFrac` values computed from the ANHYDROUS
  formulas** (`MgSO4: 0.2019`) while the concentrate is the heptahydrate — the
  exact error the "hydrate forms are explicit" rule exists to prevent.
- `dropsFor()` has no base-water subtraction, no guards, and none of the
  rounding rules.
- Bicarbonates sit at 20.000 ppm there, the rest at 30.000.
- `data.js` recipe targets are not mg/L of ion.

Take **visual** truth from the handoff and **numeric** truth from `docs/01` +
`docs/03`. (`waterProfile()`'s GH/KH factors do match, for what it's worth.)

## Stack

Mirrors `apps/crivelo-web`, not the staler `crema-arena`: **Next 16** + React 19
+ TypeScript, Tailwind v4 (`@theme`, no config file), shadcn primitives from
`@crivelo/ui`, Vitest for the engine. `next.config.ts` is TypeScript from day one
because the `@crivelo/pwa` offline half is ESM-only and throws from a CJS config.

The handoff doc assumed a standalone Vite app; that is **superseded** — Salis is
an app in this monorepo on the Crivelo stack.

**Design tokens come from `@salis/tokens`, which REPLACES `@crivelo/tokens`** —
Salis differs at Tier 1 (cool slate/teal neutrals, a full dark theme, Source Sans
3 + IBM Plex Mono, a tighter radius ramp), not at the accent tier. Never import
both foundations. Read `packages/salis-tokens/CLAUDE.md` before touching a
token — especially the hard rule that `--secondary` / `--accent` are claimed by
the shadcn bridge and the brand hues live under `--mineral*` / `--sweet*`.

No backend in v1: static content JSON plus device-local state.

## Language

**UI strings in Brazilian Portuguese; everything else English** (code, comments,
commits, docs, tests) — the monorepo-wide rule in the root `CLAUDE.md`.

Voice is the teacher's: precise, didactic, one thing per sentence, imperative
("Escolha uma receita", "Para 1 L, use 8 gotas"). Sentence case everywhere;
overlines are the only uppercase. Helper text, toasts and errors are full
sentences with a period; button labels and titles have none. pt-BR number formats
(`30.000 ppm`, `1,5 L`, `3,00 g`). Course vocabulary: *concentrado, receita,
gotas, sal/sais, água de partida, modo preparo, Aprender*.

Avoid: lifestyle/ritual language ("seu ritual", "a xícara perfeita"),
diminutives ("gotinhas"), exclamation marks, "Ops!", emoji, vague quantities
("uma pitada").

## Offline (done — RMP-259)

Installability + offline come from `@crivelo/pwa`, driven by `app/pwa.config.tsx`
(the drop mark from `@salis/tokens/assets`, teal `theme_color`). The wrappers are
thin: `app/{manifest.ts,icon.tsx,apple-icon.tsx,pwa-icon/[variant],pwa-splash/[size],
serwist/[path],sw.ts}` + `tsconfig.worker.json`.

**Salis is the app that forced `@crivelo/pwa`'s single-locale fix.** The package's
offline half assumed locale-prefixed routing; it now reads an **empty `locales`
array as "this app's routes are unprefixed"** — one document fallback at
`/offline`, and `/` precached as the shell. Pass `locales: []`, never `["pt"]`,
and keep `app/sw.ts` and `app/serwist/[path]/route.ts` in step. See
`packages/pwa/CLAUDE.md` § `locales: []`.

**The app lists its own HTML routes for the precache.** `app/serwist/[path]/route.ts`
passes `additionalPrecacheEntries` derived from `content`, because the package only
precaches the shell + offline page and Serwist's build manifest covers assets, not
rendered routes. Without it the first in-app push dies offline: Next's RSC payloads
are cached under their exact `?_rsc=<hash>` URL, and that hash differs between the
prefetch and the navigation, so the router falls back to a full browser navigation —
which only works if the document is precached. A recipe Juliana adds is covered
automatically; a NEW static route (a new tab, say) must be added to `appRoutes`.

## Repo layout (target, from the plan)

```
content/          Juliana's data as JSON (generated, committed)
content-template/ the spreadsheet template + column docs
scripts/          import-content (xlsx/csv → content/*.json, with validation)
engine/           pure TS: minerals, concentrates, dosing, substitution, plane, guards
engine/*.test.ts  Vitest (node env, no DOM) — see vitest.config.ts
app/              screens S0–S6, tabs, store, PWA bits
docs/             the handoff (01 plan, 02 research, 03 content schema)
```
