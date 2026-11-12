# Phase 1 report — Conteúdo e motor

What Phase 1 delivered, what it proved, what it could not prove, and the
questions that now block the gate.

Phase 1 of the build order is the content pipeline and the pure dosing engine,
**with no UI at all**. That held: nothing under `app/` changed beyond the
placeholder, and the engine has no DOM and no I/O.

> **The gate is not passed yet.** Its wording is "gotas batem com a planilha da
> Juliana" — the engine agreeing with *her spreadsheet*. We do not have her
> spreadsheet. What is proved below is agreement with the worked example and the
> published reference recipes, which is everything that can be proved without
> her. See "What blocks the gate".

## What shipped

| Piece | Where |
| --- | --- |
| Formula parser → molar mass + ion mass fractions | `engine/chemistry.ts` |
| Content model, raw (sheet) vs derived (json) | `engine/types.ts` |
| CSV reader for her exported tabs | `engine/csv.ts` |
| Dosing, substitution, hardness, plane, guards | `engine/dosing.ts` |
| Validating importer → `content/content.json` | `scripts/import-content.ts` |
| Spreadsheet template + column reference | `content-template/` |
| Tests | `engine/__tests__/` |

Run the importer with `pnpm --filter salis import:content`.

**128 tests pass, 3 are `todo`.** `type-check`, `lint` and `build` are green.

## What passed

**The worked example from docs/01 § Calculation rules.** 49,2 g KHCO₃ in
1.000 mL yields 30,0 mg HCO₃/mL and 1,5 mg per 0,05 mL drop; a 30 mg/L target in
1 L comes out at exactly **20 gotas**.

**Barista Hustle's 1.000 ppm stocks, within 1 %.** 2,45 g Epsom/L computes to
GH 994,9 (0,51 % off) and 1,68 g NaHCO₃/L to KH 1000,6 (0,06 % off). One mL of
stock per litre gives 1 ppm, as their method claims.

**Rao/Perger, within 5 %.** 25 g Epsom + 8,6 g NaHCO₃ in 500 mL dosed 1:200
lands on **GH 101,5** (1,5 % off 100) and **KH 51,2** (2,4 % off 50), and the
engine independently computes the 1:200 dilution as 5,0 mL of each stock per
litre.

**The plan's own "Mais doce".** Ca 25 · Mg 15 · HCO₃ 30 mg/L produces
**10 · 17 · 20 gotas** and **GH 124 · KH 25** — matching docs/01 § Screens
exactly, including the drop counts drawn in the S2 wireframe.

Also covered: base-water subtraction and its zero clamp; substitution
KHCO₃ → NaHCO₃ holding KH while swapping potassium for sodium; the rounding
rules at both ends; every guard; the plane formula and its override; and the
importer's validations.

## Defects found in adversarial review, and fixed

An independent correctness reviewer returned **BLOCK** on the first pass with
three demonstrated defects. All three are fixed, each with a regression test.

**1. A duplicated concentrate silently doubled a dose.** Each row derives its
dose independently from `targets[ion]`, so two rows supplying the same ion each
dosed the FULL target. A one-character typo in a CSV cell (`mg-30k, mg-30k, …`)
imported clean and produced two identical 10-gota rows — 20 drops of magnesium
instead of 10 — while the GH/KH summary, computed from targets rather than rows,
still read a correct 124 · 25 and hid it. The importer now rejects both a
duplicated id and two concentrates sharing an ion, and `ComputeRecipeInput`
documents the precondition for the future S6 builder.

**2. `parseDecimal` inflated sub-1 decimals by 1000×.** The thousands-separator
heuristic matched any dot-decimal with exactly three fractional digits, so
`0.125` became `125` — precisely the shape of a label value like `0.800 mg/L`
copied from an English-formatted source. A thousands-grouped number never has a
leading-zero integer part, so the rule now requires `[1-9]` first. A generous
2.000 mg/L sanity ceiling on every ion value catches the residual ambiguity
(`3.141` still reads as 3141, correctly for pt-BR).

**3. CRLF inside a quoted field left stray carriage returns.** Line endings were
normalised between rows but not inside quotes, so a Windows/Excel export of the
deliberately multi-line `steps_pt` and `body_md` carried `\r` into every line,
surviving any downstream split on `\n`.

Two further reviews — spec-compliance and architecture — returned no blockers.
The architecture review did find that the `@crivelo/pwa` single-locale gap
affects **two** files, not one: `serwist.ts` precaches nothing with `locales: []`,
alongside the known `sw.ts` fallback gap.

## Decisions taken (and why)

**Warnings are codes, not Portuguese.** The engine emits
`{ code, context }` — `kh_below_floor`, `precipitation_risk`,
`base_water_covers`, `high_drop_count` — and the UI renders Juliana's wording.
Phase 3 has her reviewing every string; copy does not belong in the one module
that must stay pure. **Phase 2 owns the code → pt-BR mapping.**

**`computeRecipe` takes one options object**, not the kickoff's five positional
arguments: it also needs the minerals (for spectator ions and the chloride
check) and the guards.

**Recipe card figures are derived by running the real engine** at import time
against distilled water, rather than computed from the targets. Targets alone
miss the spectator ions, so a card could have disagreed with the dosing screen
showing the same recipe. One code path, one answer.

**Targeted ions report the intended concentration**, `max(target, base)`, not
the rounding-jittered delivered amount — which is what makes "GH 124 · KH 25" a
stable property of a recipe rather than something that shifts with volume and
dropper. This is also why the figures match docs/01 to the digit.

**No new dependencies.** The CSV reader is ~60 lines (her `steps_pt` and
`body_md` cells carry newlines and quotes, so a naive split would corrupt
content). The importer runs on plain `node` — Node 24 strips TypeScript
natively — so no `ts-node`/`tsx` either. This is why engine imports carry
explicit `.ts` extensions.

## Researched defaults now fill the template

`content-template/` ships researched, sourced defaults rather than placeholders,
so the app is testable end to end today. Every value is traceable and meant to be
overwritten — see **`content-assumptions.md`** for the full record.

The two questions that blocked this report are now answered by evidence:

**"30.000 ppm" means ppm of the ION.** Settled by arithmetic, not opinion: it is
the only one of the three possible readings where every salt keeps its drop count
under the app's own 60-drop ceiling (the "as salt" reading needs 189 drops of
magnesium). It reproduces docs/01's S4 screen exactly, and matches the per-drop
potency of Lotus Water, the only commercial drop-dosed product. Note that
published *gram* recipes all use ppm as CaCO₃ instead — if her sheet came from
that lineage her grams differ, and only the template changes.

**The dropper must stay calibrated.** USP's "20 drops per mL" holds for water
only; Farmacopeia Brasileira requires per-device calibration, and real Brazilian
droppers span 10–40 gotas/mL. The onboarding calibration screen stays.

Two corrections came out of the research:

- **`docs/03`'s precipitation threshold of 2000 was wrong** — it fires inside the
  SCA's own core zone (the Rao/Perger recipe sits at 1954). No published Ca × HCO₃
  heuristic exists at all; the value is now 10000, above every SCA corner.
- **`docs/02`'s SBQ Itumbiara citation could not be found.** The claim it supports
  still holds via Bertolo et al. (2007, 303 brands) and an Embrapa label study.

## What blocks the gate

Three `test.todo` fixtures name these; none is a code change.

1. **Is "30.000 ppm" ppm of the ion, or of the salt?** The mitigation held: a
   concentrate stores `salt_g`, `water_ml` and its mineral, and derives the
   rest, so the answer moves **test fixtures only, never code**. A test asserts
   both readings of the same bottle — 20 gotas under the ion reading, **33
   gotas** under the salt reading. That 1,6× is the whole risk, and it is
   currently unresolved. Everything above assumes **ppm of the ion**, which is
   also what docs/01's own S4 screen implies (24,6 g KHCO₃ in 500 mL is exactly
   30.000 ppm of bicarbonate).
2. **Does the course standardise a dropper?** Every drop count above assumes
   20 gotas/mL. If a dropper is fixed, `v_gota` is a constant and the onboarding
   calibration screen goes away.
3. **Her actual guard thresholds.** 2000 / 20 / 75 are placeholders from
   docs/03's examples.

## Three findings for Juliana

These came out of building the template and are content decisions, not bugs.

**1. Gypsum cannot be a drop-dosed concentrate, so NOTHING is espresso-safe.**
Confirmed by research: CaSO₄·2H₂O dissolves at only ~2,6 g/L — about 400× less
than its neighbours — and its solubility is *retrograde*, peaking near 40 °C, so
heating does not help. At EspressoAF's recommended ~1,72 g/L working stock a
normal calcium dose would need ~70 mL per litre. Homebrewing practice is to weigh
gypsum dry into the full volume, not to make a stock.

The consequence is bigger than one substitution: **CaCl₂ is the only calcium
stock and it is a chloride, so with the current salt set no recipe can earn the
*espresso ok* badge at all.** Three ways out, all hers — dose gypsum dry, add a
soluble non-chloride calcium source (calcium lactate, ~66 g/L, food grade), or
drop the badge from v1.

**2. A 30.000 ppm magnesium stock needs 152 g of Epsom per 500 mL.** Magnesium
is only 9,9 % of the heptahydrate, so matching the bicarbonate stock's strength
takes a lot of salt (it does dissolve — about 300 g/L against a ~710 g/L
limit — but it is heavy to weigh and slow to go in). Worth confirming the
course really uses one strength for every salt.

**3. The plane formula puts "Mais doce" on the *brilhante* side.** With its own
published numbers (GH 124, KH 25, no sodium, calcium at half the hardness) the
formula from docs/01 returns **x = +0,86**, firmly at the bright end, because
the formula's neutral point sits at KH/GH = 0,5 and this recipe is at 0,20. The
sodium and calcium-share terms are what pull a recipe sweet — Rao/Perger lands
at x = −0,44 mostly because NaHCO₃ brings sodium. So either the preset's targets
or the formula's constants want revisiting. This is squarely the open question
"accept the formula with per-recipe override, or place every preset by hand?",
and the override field already works.

## Known gaps, deliberately left

- **The template's bottled-water rows are placeholders**, labelled as such.
  Needs the 2–3 brands her students actually buy, with real label values.
- **The template's recipes are illustrative.** Only "Mais doce" uses numbers
  from docs/01; the other two were built to exercise the pipeline.
- **TDS is the sum of dissolved ions.** Presented as an estimate; never to be
  compared against a meter, which reads conductivity.
- **No shelf-life logic yet.** The field is imported; the ⚠ on an expired
  concentrate is inventory state, which is Phase 2.

## Suggested next step

Phase 2 starts only after this gate. The cheapest thing that closes it is one
conversation with Juliana covering the three blockers above — then filling
`content-template/` with her real sheet and re-running the importer. If her
numbers and ours agree, the gate is passed; if they do not, the disagreement
will be in the concentrate convention, and the fixture test above already shows
exactly what each reading predicts.
