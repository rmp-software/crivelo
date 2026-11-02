> Note: this doc was written before the v1 plan and parts of it were superseded. Where the two disagree (display unit, base water, espresso badge, concentrate ion yield), `01-v1-plan.md` wins. Keep this file for the chemistry, market comparison and sources.

# Salis — UX Flow & Wireframes

Exported 2026-11-01 from the Claude Doc (source of truth: https://claude.ai/code/artifact/8222c968-b4c7-4557-a502-a1ac6c641fe9)

## Summary

Salis should ship as a three-tab mobile app (Receitas, Concentrados, Aprender) whose core loop is three taps: pick a preset, set the water amount, read drop counts. Every other feature in the spec hangs off that loop as a bottom sheet or a tap on a dimmed row, and the sensory plane is a property of each recipe rather than a screen of its own. The research changes the spec in five places:

1. **Two independent chemical quantities feed the two axes.** Total hardness sets leve↔forte; the buffer ratio (KH/GH), nudged by sodium and the calcium share, sets doce↔brilhante. This is what makes a static plane honest now and an interactive one possible later.
2. **Drop calibration is a first-run step, not a setting.** Dropper style is the single biggest source of dosing error across every kit on the market; the app asks "quantas gotas por mL" on day one.
3. **Concentrates carry their hydrate and their shelf life.** Hydrate forms change doses by up to 2× and stored concentrates precipitate or spoil, so the record that Juliana authors names the exact salt, and the user's inventory shows a date.
4. **Units are hidden behind one convention.** Ion mg/L on screen; GH/KH as CaCO₃ and TDS on tap. Unit chaos is the most repeated complaint in every forum thread read.
5. **The Brazilian gaps are content, not code.** No PT tool, no bottled-water database, no sourcing guide. Juliana's course material fills all three inside *Aprender* and the concentrate screen, which is Salis's real moat against free spreadsheets and sealed kits.

## What the research says (and what it changes in the app)

The field agrees on three things: hardness ions (Ca²⁺, Mg²⁺) drive extraction, bicarbonate (HCO₃⁻) buffers acidity, and the *ratio* between them matters more than total TDS ([Hendon & Colonna-Dashwood 2014](https://researchportal.bath.ac.uk/en/publications/the-role-of-dissolved-cations-in-coffee-extraction), [Royal Coffee sensory panel](https://royalcoffee.com/treading-water-a-practical-h2o-guide-for-coffee-professionals-part-ii-the-sensory-data/)). That ratio is what the sensory plane must encode.

**Reference ranges students will expect to see.** The [SCA 2009 table](https://open-exam-prep.com/study-guides/sca-q-grader/brewing-science-water-chemistry/sca-water-standards) gives TDS 75–250 (target 150), calcium hardness 17–85 ppm as CaCO₃ (target 68), alkalinity ≈ 40, pH 6,5–7,5. The 2018 SCA Water Quality Handbook replaces targets with a core zone of GH 50–175 and KH 40–75 ppm as CaCO₃ ([PDG PT](https://perfectdailygrind.com/pt/2023/02/10/os-baristas-e-a-qualidade-da-agua/)). No 2024+ numeric revision was found. The app should show the SCA zone as a shaded region on the plane, because every student has seen that chart.

**Ion → sensory effect**, as the sources converge (full sourcing in the Sources section):

| Ion / salt | Raises | Lowers | Too much |
| --- | --- | --- | --- |
| Ca²⁺ | sweetness, clarity, acidity perception |  | scale in machines |
| Mg²⁺ | extraction, body, floral/complex notes (light roasts) |  | cloying, "rips everything out"; needs coarser grind |
| HCO₃⁻ (KH) | roundness, buffers sourness | brightness | flat, chalky, muted above ≈70 ppm |
| Na⁺ | smoothness | bitterness | salty/metallic |
| K⁺ | fruit (claimed, weak evidence) |  |  |
| Cl⁻ vs SO₄²⁻ | Cl⁻ reads brighter (anecdotal) |  | Cl⁻ corrodes espresso boilers; SO₄²⁻ > \~50 mg/L flagged by La Marzocco |

**Named recipes the presets can be benchmarked against** (ppm as CaCO₃; a conversion table lives in the Sources tab):

| Recipe | GH | KH | Character | Source |
| --- | --- | --- | --- | --- |
| Melbourne | 24 | 12 | very soft, long filter brews | [Barista Hustle](https://www.baristahustle.com/blog/diy-water-recipes-red) |
| SCA | 69 | 40 | reference | Barista Hustle |
| Barista Hustle | 81 | 40 | balanced default | Barista Hustle |
| Rao/Perger | 100 | 50 | balanced, more buffer | [Home-Barista thread](https://www.home-barista.com/water/matt-pergers-water-recipe-for-coffee-is-it-ok-safe-for-espresso-machines-what-do-you-think-t42255.html) |
| Hendon | 100 | 31 | centre of the "ideal brew zone" | Barista Hustle |
| Light & Bright (Hedrick) | 60 (all Ca) | 25 | forward acidity, clean finish | [Scott Rao](https://www.scottrao.com/blog/lotus-water-drops) |
| Simple & Sweet (Lotus) | 90 | 40 | muted acidity, heavier body | [Prima Coffee](https://prima-coffee.com/blog/video-overview-lotus-coffee-water-kit/) |
| Kaffeemacher filter zone | 36–54 | 18–36 | acidity and sweetness forward | [Kaffeemacher](https://kaffeemacher.de/en/blogs/kaffeewissen/water-for-coffee-results-and-recommendations) |

**Concentrate practice that the app must respect**

- Strong stocks are the norm: Barista Hustle uses two 1.000 ppm concentrates (2,45 g Epsom/L for GH, 1,68 g NaHCO₃/L for KH) so that 1 g of stock per litre = 1 ppm. Lotus droppers deliver ≈ 10 ppm GH or 5 ppm KH per drop in 450 mL. Juliana's 30.000 ppm stocks are \~30× stronger, so one drop (0,05 mL) in 1 L ≈ 1,5 ppm of the salt, a usable resolution.
- Hydrate forms change the dose by up to 2×: Epsom is MgSO₄·7H₂O (246 g/mol), CaCl₂ is sold anhydrous, dihydrate or as wet flakes. The concentrate record must name the hydrate and the app must never let the user retype a gram figure.
- Ca and bicarbonate stocks precipitate CaCO₃ if combined at concentrate strength; they stay in separate bottles and meet only in the jug. Hence the fixed "bicarbonato por último" line on every recipe.
- Units confuse everyone: ion mg/L and ppm-as-CaCO₃ are different numbers for the same water (Ca × 2,5; Mg × 4,1; HCO₃ × 0,82). TDS meters read conductivity, not minerals. The app should pick one display convention and show the other only on demand.
- Mg-only waters (Barista Hustle style) are discouraged in espresso machines; recipes intended for espresso need some Ca and ideally no chloride.

**Brazilian specifics**

- Portuguese-language sources are thin; Kaffeemacher's [PT page](https://kaffeemacher.de/pt/blogs/kaffeewissen/kaffeewasser) is the best explainer, which leaves room for the *Aprender* tab to be a real differentiator.
- Bottled "água mineral" in Goiás is soft: a survey of 7 brands in Itumbiara found hardness 7–68 ppm as CaCO₃ and no alkalinity on the label ([SBQ](https://www.sbq.org.br/34ra/cdrom/resumos/T2826-2.pdf)). Students will ask whether they can start from bottled water instead of distilled; v1 says no, v2 could accept a base-water profile.
- The one Brazilian forum thread on the subject ([Clube do Café, 2014](https://forum.clubedocafe.net/topic/2436-%C3%A1gua-vs-caf%C3%A9/)) shows the two real pain points: sourcing food-grade CaCl₂ locally and dosing confusion. Both map to features already in the flow ("Onde comprar" on the concentrate screen, drops as the unit).

## Market: what exists and where Salis fits

No tool found combines the three things Salis is built on: drops as the unit, Juliana-authored concentrates and substitution rules, and a sensory chart. The free tier of this market is spreadsheets; the polished products are sealed kits that hide their ppm; and nothing exists in Portuguese.

| Product | Form | Flow (input → output) | Unit | Custom recipes | Concentrate recipes | Substitution | Sensory view | Price | Reaches Brazil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Barista Hustle calculator](https://www.baristahustle.com/?p=350791) | web | start GH/KH → target preset or custom → grams of 2 concentrates | g, ppm CaCO₃ | yes | yes (2 DIY) | lesson only | none | free | yes (web, PT site) |
| [Lotus Water](https://lotuscoffeeproducts.com/pages/product-instructions) | 4 dropper bottles + web calc | preset or ppm → volume → dropper style → drops per mineral | drops | yes | no (sealed) | Ca/Mg, Na/K choice | named recipes only | US$62 kit | no |
| [Third Wave Water](https://support.thirdwavewater.com/en-US/how-do-i-make-third-wave-water-86985) | dry sticks | 1 stick per fixed volume | stick | no | no | no | roast names | US$16/12 | no |
| [Aquacode](https://us.theroasterspack.com/products/aquacode-coffee-brewing-water) | sachet + printed chart | sachet ÷ litres via chart | L → TDS | dilution only | no | no | none | US$30/12 | no |
| [Empirical Water](https://empiricalwater.com/pages/user-guide) | 2 concentrates + buffer + web calc | volume + profile + roast → mL of each | mL | yes, shareable | no | hardness/buffer independent | roast selector | US$40–80 | no |
| [Apax Lab](https://apaxlab.com) | 4 flavour-named blends + quiz | quiz → g/L, or drops in the cup | g, drops | blend ratios | no | no | flavour names | ≈ R$900 set | import only |
| [BrewWater](https://apps.apple.com/app/id6759792840) | iOS app, free | recipe → direct / concentrate / drops mode | dynamic | yes + community | yes | any salt | none | free | iOS, EN only |
| [Gagné sheet](https://coffeeadastra.com/2019/08/23/a-tool-and-videos-for-crafting-custom-brew-water/) · [EspressoAF](https://espressoaf.com/guides/water.html) · [Coffee Chronicler](https://coffeechronicler.com/coffee-water-calculators/) | spreadsheets / web forms | ions → grams, 1.000 or 10.000× concentrates | g, ppm | yes | yes | explicit factors | none | free | EN only |
| [FourSix timer](https://apps.apple.com/app/id1519905670) (Kasuya, not water) | iOS app | 3 questions (sweeter/brighter, strength, size) → pour recipe | g, s | yes | — | — | two levers, no chart | free / Pro | yes |

**Closest reference: [Cafelytic](https://cafelytic.com/index.html)** (free, English, web-only, anonymous). Three numbered steps: starting-water ions (0 for distilled/RO) → target profile (SCA-range presets or typed ions) → grams of each salt for a 0,01 g scale, with GH/KH, estimated TDS and SO₄:Cl ratio as outputs. It has a public recipe library users share into and copy from, and a [beginner guide](https://cafelytic.com/start.html) with ion→taste notes. It has no concentrates, drops, substitution, sensory chart, hydrate forms, Portuguese or mobile-first layout. The recipe library is the pattern to borrow for v2. Note that its guide puts body on calcium and brightness on magnesium, the reverse of the Royal Coffee panel above; the literature does not settle which hardness ion sits where on the doce↔brilhante axis, which is why coordinates stay overridable per recipe.

**Patterns that work, and that the flow above already uses**

1. Named presets with a custom escape hatch (every serious tool).
2. Output in the unit the user physically handles, with the ion table as a secondary panel (Lotus drops, Empirical mL + a matching syringe).
3. Independent levers that map to taste directions (Empirical hardness vs buffer, Lotus Ca/Mg vs Na/K) — exactly the two axes of the plane.
4. Taste-first discovery: Rao's split-cup hack and Apax's "drops into the finished cup". Cheap to add as an *Aprender* lesson and later as a guided mode.
5. Machine-safety guardrails inside the tool (chloride warning, LSI) instead of in forums.
6. Shareable profiles (Empirical, BrewWater community library) — the loop a course cohort will want.

**Recurring complaints Salis can turn into features**

| Complaint (source) | Salis answer |
| --- | --- |
| Sealed kits hide the ppm; users "shoot in the dark" ([r/pourover](https://redlib.groet-infra.nl/r/pourover/search?q=lotus+water+drops&restrict_sr=on&sort=top)) | every recipe shows its ions; every concentrate shows its prep |
| Drop size varies with dropper style; Lotus must ask round vs straight | gotas/mL calibration in onboarding, default 20 |
| Fixed-strength sticks taste too strong, users dilute by hand | water-amount stepper rescales everything |
| Concentrates precipitate or grow bacteria ([EspressoAF](https://espressoaf.com/guides/water.html)) | separate bottles by design; shelf-life badge in *Meus concentrados* |
| Unit chaos: ppm-as-CaCO₃ vs mg/L vs °dH vs TDS meter | one convention on screen, the others on tap |
| Jargon overload for beginners | sensory promise first, chemistry second, on every card |
| Free tools are spreadsheets with no mobile UX | mobile-first, offline calculator |

**Absent for Brazilian users (all confirmed gaps)**

- No Portuguese app, calculator or planilha for coffee water; the only local path is Apax imported by Brew Concept at ≈ R$900 ([Unique Cafés](https://uniquecafes.com.br/agua-para-cafe-como-criar-a-agua-perfeita-para-seu-cafe-com-apax-lab/)).
- No Brazilian bottled-water database in any tool (Crystal, Minalba, Bonafont uncatalogued); labels report mg/L and "resíduo seco a 180 °C", not GH/KH.
- No sourcing guidance for food-grade salts in BRL; the 2014 Clube do Café thread stalled on where to buy CaCl₂.
- Dosing outputs assume proprietary bottles, not drogaria droppers and syringes.

The first three are content Juliana already has or can write once; they belong in *Aprender* and on the concentrate screen, not in the calculator.

## Information architecture

Four entities carry the whole app; everything the user sees is a view over them. Juliana edits three of them from an admin panel; the user owns only *Receitas personalizadas* and *Meus concentrados*.

| Entity | Owned by | Fields that matter for UX | Example |
| --- | --- | --- | --- |
| Mineral (sal) | Juliana | name, formula, hydrate form, ions it adds (mg of Ca²⁺ / Mg²⁺ / HCO₃⁻ / Cl⁻ / SO₄²⁻ per g), sensory note, where to buy in Brazil | Sulfato de magnésio hepta-hidratado (sal de Epsom), MgSO₄·7H₂O |
| Concentrate (concentrado) | Juliana | mineral, target strength (ppm or g/L), fixed prep recipe (g of salt + mL distilled water), drop volume assumption (mL per drop), shelf life, storage note | Mg 30.000 ppm: 30 g MgSO₄·7H₂O em 1 L |
| Equivalence rule | Juliana | mineral A → mineral B, conversion factor for the shared ion, side-effect note (counter-ion changes) | CaCl₂ ↔ CaSO₄: same Ca²⁺, swaps cloreto por sulfato (menos corpo, mais clareza) |
| Water recipe (receita de água) | Juliana (preset) or user (custom) | name, one-line sensory promise, target ions in ppm, derived concentrate list with drops per 100 mL, sensory-plane coordinates (x, y), level (iniciante/avançado), notes | "Mais doce": Ca 20 · Mg 40 · HCO₃ 25 · (x −0,6, y +0,2) |

Two user-side records sit on top: **Meus concentrados** (which concentrates the user has prepared, with a prep date) and **Receitas personalizadas** (saved custom recipes). Both are per-device in v1, synced to an account only if login ships.

**Navigation** is a three-tab bottom bar; the sensory plane is not a destination, it lives inside each recipe.

| Tab | Holds | Why it is a tab |
| --- | --- | --- |
| Receitas | preset list, custom list, recipe detail, calculator | the daily entry point (spec step 1) |
| Concentrados | catalogue of all concentrates, each with prep recipe and have/don't-have toggle | the second most frequent task: "preciso preparar o concentrado X" |
| Aprender | short lessons from the course: why water matters, how to read the plane, how to prepare, FAQ | keeps the didactic voice without cluttering the calculator; cheap to ship as static content |

Desktop is the same three tabs as a left rail; nothing is desktop-only.

## Core flow: receita → água → gotas → concentrado

The happy path is three taps from app open to a dosing instruction, and the "I don't have this concentrate" branch never leaves the recipe context. Wireframes below are mobile (390 px); mono type marks every quantity. Drop counts and ion figures in the frames are placeholders until Juliana confirms the concentrate convention (see open questions).

**Screen 1 · Receitas (home).** Presets first, user's own recipes under them. Each card leads with the sensory promise, not the chemistry; the thumbnail is the recipe's point on the plane.

```
┌──────────────────────────────────────┐
│ Salis                        ⚙  👤   │
│                                      │
│ Receitas de água                     │
│ ┌──────────┐ ┌──────────┐            │
│ │ Presets  │ │ Minhas   │   (segmented control)
│ └──────────┘ └──────────┘            │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Mais doce              ┌──┐      │ │
│ │ Realça doçura e corpo  │ ·│ plane│ │
│ │ em cafés lavados       └──┘ thumb│ │
│ │ Ca 20 · Mg 40 · HCO₃ 25   3 conc.│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Mais brilhante          ┌──┐     │ │
│ │ Acidez viva, corpo leve │· │     │ │
│ │ Ca 35 · Mg 15 · HCO₃ 15 └──┘     │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Equilibrada (SCA)                │ │
│ └──────────────────────────────────┘ │
│                                      │
│   [ + Criar receita personalizada ]  │
│                                      │
├──────────────────────────────────────┤
│  ● Receitas    ○ Concentrados  ○ Aprender │
└──────────────────────────────────────┘
```

**Screen 2 · Receita (detail + calculator).** The water-amount stepper sits above the dose list and rescales it live. Each concentrate row shows the drop count as the hero number, with mL as a quiet secondary for users who use a pipette or scale. Rows the user lacks are dimmed with a "Preparar" affordance (spec step 4).

```
┌──────────────────────────────────────┐
│ ‹ Receitas          Mais doce    ⋯   │
│                                      │
│ Realça doçura e corpo em cafés       │
│ lavados. Boa para V60 e Kalita.      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │      brilhante                   │ │
│ │          │                       │ │
│ │ leve ─────┼───●──── forte        │ │  sensory plane
│ │          │                       │ │  (static, v1)
│ │        doce                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Quantidade de água                   │
│   ┌───┐  ┌────────────┐  ┌───┐       │
│   │ − │  │  1.000 mL  │  │ + │  [500][1 L][2 L]
│   └───┘  └────────────┘  └───┘       │
│                                      │
│ Concentrados para 1.000 mL           │
│ ┌──────────────────────────────────┐ │
│ │ ◆ Mg 30.000 ppm  (MgSO₄)         │ │
│ │   40 gotas       ≈ 2,0 mL     ✓ │ │
│ ├──────────────────────────────────┤ │
│ │ ◆ Ca 30.000 ppm  (CaCl₂)         │ │
│ │   20 gotas       ≈ 1,0 mL     ✓ │ │
│ ├──────────────────────────────────┤ │
│ │ ◇ KHCO₃ 30.000 ppm   (dimmed)    │ │
│ │   25 gotas       ≈ 1,25 mL       │ │
│ │   Não tem? → Preparar concentrado│ │
│ └──────────────────────────────────┘ │
│                                      │
│ Resultado  Ca 20 · Mg 40 · HCO₃ 25   │
│            TDS ≈ 280 ppm · GH 214 · KH 21
│                                      │
│ Ordem: adicione na água destilada,   │
│ bicarbonato por último. Agite.       │
│                                      │
│ [ Substituir mineral ]  [ Salvar cópia ]
└──────────────────────────────────────┘
```

**Screen 3 · Concentrado (prep recipe).** Reached by tapping a dimmed row or from the Concentrados tab. Fixed quantities set by Juliana (spec: static recipes), a checklist the user can tick while weighing, and a "Tenho este concentrado" toggle that flips the row to ✓ back on Screen 2.

```
┌──────────────────────────────────────┐
│ ‹ Mais doce      KHCO₃ 30.000 ppm    │
│                                      │
│ Bicarbonato de potássio              │
│ Fonte de alcalinidade (KH). Suaviza  │
│ acidez e dá corpo; demais, apaga o   │
│ brilho.                              │
│                                      │
│ Rende  1.000 mL  (≈ 20.000 gotas)    │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ☐  30,0 g   KHCO₃ (grau alimentar)│ │
│ │ ☐  1.000 mL água destilada ou RO  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 1. Pese o sal em balança 0,1 g.      │
│ 2. Dissolva em 500 mL, agite 1 min.  │
│ 3. Complete até 1.000 mL. Rotule     │
│    com nome e data.                  │
│                                      │
│ Guarde em frasco conta-gotas 1 mL =  │
│ 20 gotas. Válido 3 meses.            │
│                                      │
│ Onde comprar  →  (lista da Juliana)  │
│                                      │
│ [ ✓ Tenho este concentrado ]         │
└──────────────────────────────────────┘
```

Tapping *Tenho este concentrado* returns to Screen 2 with the row now active; the dose list never had to be recomputed, only unlocked.

## Secondary flows

**Substituir mineral (from Screen 2).** A bottom sheet, not a new screen: the user swaps one concentrate for an equivalent that Juliana has mapped, the drop counts recompute, and the sensory note tells them what changes. Only rules Juliana entered appear, so the user never sees an impossible swap.

```
┌──────────────────────────────────────┐
│ ─────  Substituir Ca 30.000 (CaCl₂)  │
│                                      │
│ Você não tem cloreto de cálcio?      │
│ Use um destes para o mesmo Ca²⁺:     │
│                                      │
│ ○ Sulfato de cálcio  30.000 ppm      │
│   26 gotas (era 20)                  │
│   Troca cloreto por sulfato:         │
│   menos corpo, mais clareza.   ✓ tem │
│                                      │
│ ○ Hidróxido de cálcio  ...           │
│   Também adiciona alcalinidade —     │
│   KHCO₃ cai para 12 gotas.   ✗ não tem│
│                                      │
│ [ Aplicar substituição ]             │
└──────────────────────────────────────┘
```

**Criar receita personalizada (advanced).** Two modes in one form. *Por íons* (the student knows the target ppm) and *Por concentrados* (the student just wants to dose what they own). Both show the resulting point on the plane and the ion totals live, so the plane teaches as they type.

```
┌──────────────────────────────────────┐
│ ‹ Cancelar    Nova receita    Salvar │
│                                      │
│ Nome  ┌───────────────────────────┐  │
│       │ Geisha domingo            │  │
│       └───────────────────────────┘  │
│                                      │
│ Partir de:  ○ zero  ● "Mais doce"    │
│                                      │
│ ┌───── por íons ─────┬─ por concentrados ─┐
│                                      │
│ Alvo (ppm)                           │
│  Ca²⁺   ┌──────┐ ◁▷   20 → 30        │
│  Mg²⁺   ┌──────┐ ◁▷   40             │
│  HCO₃⁻  ┌──────┐ ◁▷   25             │
│                                      │
│ Concentrados que você tem            │
│  ✓ Mg 30.000 (MgSO₄)                 │
│  ✓ Ca 30.000 (CaCl₂)                 │
│  ✗ KHCO₃ 30.000   → usar NaHCO₃?     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │     brilhante                    │ │
│ │ leve ─────┼──○──●── forte        │ │ ○ base  ● nova
│ │       doce                       │ │
│ └──────────────────────────────────┘ │
│ Para 1 L: 40 · 30 · 25 gotas         │
│ TDS ≈ 300 · GH 239 · KH 21           │
│ ⚠ Ca acima de 70 ppm + KH alta pode  │
│   precipitar. Veja Aprender › Limites│
└──────────────────────────────────────┘
```

**Meus concentrados (Concentrados tab).** The catalogue is the same list as the admin's, with a have/don't-have state per item and the prep date. A stale badge appears past the shelf life Juliana sets. This state is what drives the ✓/dimmed rows on every recipe.

```
┌──────────────────────────────────────┐
│ Concentrados                   Filtro│
│                                      │
│ Tenho (2)                            │
│ ◆ Mg 30.000 ppm  MgSO₄   prep. 03/10 │
│ ◆ Ca 30.000 ppm  CaCl₂   prep. 12/09 ⚠ vence 12/12
│                                      │
│ Ainda não tenho (4)                  │
│ ◇ KHCO₃ 30.000 ppm      usado em 3 receitas
│ ◇ NaHCO₃ 30.000 ppm     usado em 1 receita
│ ◇ CaSO₄ 30.000 ppm      substituto de Ca
│ ◇ MgCl₂ 30.000 ppm      substituto de Mg
└──────────────────────────────────────┘
```

**Onboarding (first run, three screens, skippable).** 1) the thesis in one line — a água é o primeiro ingrediente; 2) "quais concentrados você já tem?" as a tap-to-select grid, which pre-fills Meus concentrados so the first recipe already shows ✓ and ◇ correctly; 3) "quantas gotas por mL tem seu conta-gotas?" with the default 20 and a 10-second calibration tip. Step 3 is the single biggest accuracy lever in the whole app, so it is in onboarding and not buried in settings.

## Sensory plane: how two numbers become a point

The plane works if the two axes come from two independent chemical quantities. Total hardness (GH) alone sets *mais leve ↔ mais forte*; the buffer ratio (KH/GH), nudged by sodium and by the Ca share of hardness, sets *doce ↔ brilhante*. That matches what the sources say each ion does and keeps the Kasuya vocabulary students already know.

```
                 mais forte (GH alto)
                        │
   Rao/Perger ●         │      ● Hendon       ● Pretty Hard
       Simple & Sweet ● │
doce ───────────────────┼─────────────────── brilhante
                SCA ●   │ ● Barista Hustle
                        │        ● Light & Bright
                        │
                 mais leve (GH baixo)   ● Melbourne

x = (0,5 − KH/GH) / 0,35 − Na/80 + 0,3·(Ca share − 0,5)     y = (GH − 80) / 80
SCA zone (GH 50–175, KH 40–75) is a diagonal band from lower-left to upper-centre.
```

The mapping is a proposal for Juliana to tune, not a measurement: the named recipes land where their authors describe them (Light & Bright on the bright side, Rao/Perger and Simple & Sweet on the sweet side, Melbourne at the bottom), which is the test it needs to pass. The SCA zone is drawn with straight edges for v1; its true shape curves, which is why the SCA point sits on its edge rather than inside. Rules for v1:

- Coordinates are stored on each recipe, computed once by the formula above and editable by Juliana per recipe, so she can override the model where her palate disagrees.
- The plane is read-only: one accent dot for the current recipe, a hollow dot for the base recipe in the builder, the SCA zone as a quiet tint. No dragging. The interactive version (drag the dot, get a recipe) is the premium feature and only needs the inverse of the same two formulas.
- On recipe cards the plane shrinks to a 32 px thumbnail with just the dot; on the detail screen it is full width with axis words; in *Aprender* it appears once with all presets plotted, which is also the screen that teaches the model.
- Axis words stay in Portuguese and stay Kasuya's (doce/brilhante, leve/forte); ppm appear only on hover or in the detail text under the chart.

## Calculation rules, units and edge cases

One formula drives every number on Screen 2: drops of a concentrate = target ppm of its ion × water volume ÷ (concentrate ppm of that ion × drop volume). Everything else is presentation.

```latex
\text{gotas} = \frac{C_{alvo}\ [\text{mg/L}] \times V_{água}\ [\text{L}]}{C_{conc}\ [\text{mg/L}] \times v_{gota}\ [\text{L/gota}]}
```

| Rule | Behaviour in the UI |
| --- | --- |
| Drop volume | Default 0,05 mL (20 gotas/mL), set in onboarding, editable in Ajustes. Changing it recomputes every recipe; a toast says so. |
| Rounding | Drops round to the nearest whole; below 0,5 gota the row shows "use pipeta: 0,3 mL" instead of "0 gotas". Above 60 gotas the row offers the mL figure first and suggests a stronger concentrate. |
| ppm convention | The app's ppm is mg/L of the ion (Ca²⁺, Mg²⁺, HCO₃⁻). GH/KH "as CaCO₃" are shown as secondary numbers only, with a tooltip, because students see them on test strips and in SCA tables. |
| Hydrate forms | Concentrate recipes always name the hydrate (MgSO₄·7H₂O, CaCl₂·2H₂O) and the gram mass is for that hydrate; the ion yield is stored, not recomputed by the user. |
| Water volume | Stepper in 100 mL steps between 100 mL and 5 L, quick chips 500 / 1 L / 2 L, free text allowed. |
| Mixing order | Every recipe ends with a fixed line: add concentrates to distilled/RO water, bicarbonate last, shake. Shown, never hidden behind an info icon. |
| Precipitation guard | When Ca²⁺ and HCO₃⁻ together exceed a threshold Juliana sets, a warning appears on the recipe and in the builder. |
| Substitution | Applies the equivalence factor to the shared ion, then re-runs the formula; counter-ion change is stated in one sentence from the rule's note. If the substitute also adds alkalinity, the HCO₃⁻ concentrate's drops are reduced and the change is shown as "era X → agora Y". |
| Missing concentrate | Dimmed row, drop count still visible, CTA "Preparar concentrado". The recipe is never blocked. |
| Base water | v1 assumes distilled/RO (0 ppm). A "minha água de partida" field is a v2 item; see open questions. |

**States the design must cover**

- Empty *Minhas receitas*: one card explaining what a custom recipe is, CTA to start from a preset.
- No concentrates marked as owned: Screen 2 shows all rows dimmed with a single banner "Comece preparando o Mg 30.000" linking to the cheapest first concentrate.
- Expired concentrate: row shows ⚠ and the recipe still computes; tapping the badge opens the prep recipe.
- Admin changed a preset the user had copied: the user's copy keeps its values, with a "receita base atualizada" chip and a diff on tap.
- Offline: all presets, concentrates and rules are cached on first load; the calculator never needs the network.

## MVP scope, open questions, sources

**Ship in v1 (free, first cohorts):** Receitas tab with presets and detail/calculator; Concentrados tab with prep recipes and have/don't-have state; substitution bottom sheet driven by Juliana's rules; static sensory plane; onboarding with drop calibration; offline cache; admin panel for Juliana (minerals, concentrates, rules, presets). Custom recipe builder ships in v1 only if the *por concentrados* mode is enough; the *por íons* mode can wait.

**Hold for v2 / premium:** interactive plane (drag → recipe); base-water profile and a Brazilian bottled-water table; shareable recipes between students; LSI / espresso-safety flag; split-cup tasting mode; accounts and sync.

**Open questions for Juliana**

- [ ] Display unit: ion mg/L (recommended) or ppm as CaCO₃? Her course material decides.
- [ ] Concentrate strength: is 30.000 ppm the standard for every salt, and is it ppm of the salt or of the ion?
- [ ] Dropper: does the course ship or recommend a specific conta-gotas? If so, fix 20 gotas/mL and skip calibration.
- [ ] Preset list for launch: the six names and their target ions, plus which ones are espresso-safe.
- [ ] Substitution rules: the initial list of allowed swaps and the one-line sensory note for each.
- [ ] Precipitation threshold for the Ca + HCO₃ warning.
- [ ] Plane coordinates: accept the formula as default and override per recipe, or place every preset by hand?
- [ ] Does v1 need login, or is per-device state enough for the first cohorts?

**Sources**

Chemistry: [Hendon & Colonna-Dashwood 2014](https://researchportal.bath.ac.uk/en/publications/the-role-of-dissolved-cations-in-coffee-extraction) · [Royal Coffee sensory panel](https://royalcoffee.com/treading-water-a-practical-h2o-guide-for-coffee-professionals-part-ii-the-sensory-data/) · [SCA 2009 water table](https://open-exam-prep.com/study-guides/sca-q-grader/brewing-science-water-chemistry/sca-water-standards) · [PDG PT on SCA ranges](https://perfectdailygrind.com/pt/2023/02/10/os-baristas-e-a-qualidade-da-agua/) · [Barista Hustle DIY water](https://www.baristahustle.com/?p=2281) · [Barista Hustle Redux](https://www.baristahustle.com/blog/diy-water-recipes-red) · [Scott Rao on Lotus drops](https://www.scottrao.com/blog/lotus-water-drops) · [Rao/Perger thread](https://www.home-barista.com/water/matt-pergers-water-recipe-for-coffee-is-it-ok-safe-for-espresso-machines-what-do-you-think-t42255.html) · [Kaffeemacher results](https://kaffeemacher.de/en/blogs/kaffeewissen/water-for-coffee-results-and-recommendations) · [Kaffeemacher PT](https://kaffeemacher.de/pt/blogs/kaffeewissen/kaffeewasser) · [Clive Coffee](https://clivecoffee.com/blogs/learn/how-to-build-a-diy-water-recipe-for-espresso-at-home-clive-coffee) · [Carbonate concentrate thread](https://www.home-barista.com/water/all-carbonate-water-recipe-cloudy-concentrate-no-sodastream-t56591.html) · [Kasuya 4:6](https://honestcoffeeguide.com/brew-recipes/tetsu-kasuya-4-6-method-stronger/)

Market: [Barista Hustle calculator](https://www.baristahustle.com/?p=350791) · [Lotus instructions](https://lotuscoffeeproducts.com/pages/product-instructions) · [Third Wave Water profiles](https://support.thirdwavewater.com/en-US/what-is-the-difference-between-the-six-water-profiles-76745) · [Aquacode](https://us.theroasterspack.com/products/aquacode-coffee-brewing-water) · [Empirical Water guide](https://empiricalwater.com/pages/user-guide) · [Apax Lab](https://apaxlab.com) · [Apax review, Barista Magazine](https://www.baristamagazine.com/test-drive-apax-lab-water-minerals/) · [BrewWater app](https://apps.apple.com/app/id6759792840) · [Coffee ad Astra sheet](https://coffeeadastra.com/2019/08/23/a-tool-and-videos-for-crafting-custom-brew-water/) · [EspressoAF water guide](https://espressoaf.com/guides/water.html) · [Coffee Chronicler calculators](https://coffeechronicler.com/coffee-water-calculators/) · [FourSix timer](https://apps.apple.com/app/id1519905670) · [r/pourover threads](https://redlib.groet-infra.nl/r/pourover/search?q=lotus+water+drops&restrict_sr=on&sort=top)

Brazil: [Clube do Café, Água vs café](https://forum.clubedocafe.net/topic/2436-%C3%A1gua-vs-caf%C3%A9/) · [SBQ survey of mineral waters, Itumbiara-GO](https://www.sbq.org.br/34ra/cdrom/resumos/T2826-2.pdf) · [Unique Cafés on Apax in Brazil](https://uniquecafes.com.br/agua-para-cafe-como-criar-a-agua-perfeita-para-seu-cafe-com-apax-lab/) · [Café di Famiglia](https://cafedifamiglia.com.br/agua-para-cafe/) · [Bem Paraná, fonte para cafés especiais](https://www.bemparana.com.br/noticias/parana/apos-descoberta-de-fonte-diferenciada-no-parana-empreendedores-produzem-agua-para-cafes-especiais/)

Not reached this session: Aquacode's own ppm figures, Apax's recipe calculator, several Home-Barista threads, Mercado Livre listings. Stoichiometric figures in this doc (ion per gram of salt, conversion factors) are computed from standard molar masses, not quoted.
