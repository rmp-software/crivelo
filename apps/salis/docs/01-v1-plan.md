# Salis — v1 Plan

Exported 2026-11-01 from the Claude Doc (source of truth: https://claude.ai/code/artifact/12e7b5fe-e36f-46ef-ab1e-2497aa1fd02d)

v1 is the app a student opens after Juliana's class to make the water she taught, with the concentrates they actually have on the counter.

## What v1 is

v1 is a closed beta for Juliana's first turmas: a mobile-first web app (installable, works offline) with Juliana's presets, her concentrates, her substitution rules and her lessons, plus a dosing calculator that turns any of it into drops for the jug on the counter. No payments, no accounts, no interactive plane. The goal of the beta is one measurable thing: a student who finished the course makes correct water at home without messaging Juliana.

The principles below are the ones that decide ties when scope is argued over. Each came from the research in [Salis — UX Flow & Wireframes](https://claude.ai/code/artifact/8222c968-b4c7-4557-a502-a1ac6c641fe9) or from the transcription.

1. **The first job is preparing concentrates, not picking recipes.** A student can't make any water until the first bottle exists. The app routes a new user to their first concentrate before it sells them the recipe list.
2. **Drops are the unit; everything else is on tap.** The hero number is gotas for the water amount on screen. GH and KH as CaCO₃ are the one summary line, because that is what SCA charts, test strips and every other tool use. Individual ions live behind a tap.
3. **Juliana's judgement over any formula.** Presets, substitution rules, sensory coordinates and warnings are content she authors. The app computes, it does not opine.
4. **Never block a brew.** A missing concentrate dims a row and offers two ways out (an equivalent the user owns, or the prep recipe); it never hides the recipe.
5. **Built for wet hands.** Large numbers, tappable rows that tick as you dose, screen stays awake, nothing important below the fold on a 390 px phone.
6. **Honest about uncertainty.** Where the literature disagrees (which hardness ion reads bright), the app follows Juliana's coordinates and the *Aprender* tab says the field is not settled.

## Who uses it

Three people, and the beginner student decides every default.

| Person | Situation when they open the app | What they need from it | What they will not do |
| --- | --- | --- | --- |
| Aluno iniciante (most of the beta) | Finished the course last week. Has distilled water from the farmácia, a conta-gotas, maybe one or two salts bought from Juliana's list, a kitchen scale. Wants today's coffee to taste like class. | A recipe with a name they remember, drops per litre, the order to add them, and a clear path when a bottle is missing. | Read ppm. Convert units. Weigh milligrams. Type anything long. |
| Aluno avançado | Owns all the concentrates, has an espresso machine or competes. Wants "mais doce" but a bit brighter, and to keep what works. | Nudge a preset by drops, see where it lands on the plane, save it with a name, know if it is safe for the machine. | Build water from ion targets in v1; wait for sync across devices. |
| Juliana (admin) | Between turmas, updating what she teaches. | Change a preset, add a concentrate, add an equivalence rule or a bottled-water profile, write a lesson, and see it on students' phones. | Use a developer tool. Re-enter the same data twice. |

Two contexts shape the screens more than the personas: the **kitchen counter** (phone flat on the bench, wet hands, jug and bottles in front, 30 seconds of attention) and the **sofa** (planning, reading *Aprender*, deciding what to buy). The dosing screen is designed for the counter; everything else for the sofa.

## User journey

The spine is four taps (home → receita → água → modo preparo); the two decisions only add a detour, never a dead end.

```
Primeira abertura
      │
      ▼
Tem algum concentrado? ──não──▶ Prepara o 1º concentrado (o que libera mais receitas)
      │ sim                                 │ 1ª garrafa pronta
      ▼ ◀───────────────────────────────────┘
Receitas (home)
      │
      ▼
Abre uma receita, define a quantidade de água
      │
      ▼
Falta concentrado? ──sim──▶ Linha apagada oferece: usar equivalente que você tem,
      │ não                 ou preparar e marcar "tenho"
      ▼ ◀───────────────────────────────────┘ linha liberada
Modo preparo (tica cada concentrado dosado)
      │
      ▼
Água pronta
```

A new user with no concentrates is sent to prepare the one that unlocks the most presets before they see the recipe list as a destination; a user with a missing bottle gets the way out inside the dimmed row, and comes back to the same recipe with the row active.

What each step feels like from the counter:

1. **Primeira abertura** (sofa, 90 s): three screens — the thesis, "quais concentrados você já tem?" as a tap grid, "quantas gotas por mL?" with 20 as default and a 10-second calibration tip. If the grid comes back empty, the last screen is "Comece pelo Mg" with a button straight to its prep recipe.
2. **Receitas** (sofa or counter): presets by sensory name, each with its plane thumbnail, an *espresso ok* badge where Juliana marked it, and a count of how many concentrates the user still lacks ("falta 1").
3. **Receita** (counter): water amount up top (last used remembered), the drop list as the hero, one summary line in GH/KH, mixing order fixed at the bottom. Base water defaults to destilada/RO; a chip switches to one of Juliana's bottled profiles and the drops recompute.
4. **Linha apagada** (counter): the row shows the drops anyway, then one of two offers. If an equivalent in the user's inventory exists: "Use NaHCO₃: 20 gotas" and a one-line note on what changes in the cup. Otherwise: "Preparar concentrado".
5. **Prepara concentrado** (sofa, then scale): fixed grams and mL from Juliana, a checklist, the label text to write on the bottle so it matches the app's row name, and "Tenho este concentrado" at the end.
6. **Modo preparo** (counter): rows become large tappable tiles, each ticks when dosed, screen stays awake, bicarbonate tile is last and says so.
7. **Água pronta**: a quiet confirmation with the GH/KH line and a "Salvar como minha receita" link for advanced users.

## Screens

Seven screens cover v1; three tabs (Receitas, Concentrados, Aprender) hold them. Frames are 390 px wide; mono type marks quantities. Figures assume 30.000 ppm concentrates *of the ion* and 20 gotas/mL (see open questions), so the example preset "Mais doce" = Ca 25 · Mg 15 · HCO₃ 30 mg/L → 17 · 10 · 20 gotas per litre, GH 124 · KH 25.

**S0 · Primeira abertura** — three swipes, skippable, 90 seconds.

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│                │ │ Quais concen-  │ │ Seu conta-gotas│
│  A água é o    │ │ trados você já │ │                │
│  primeiro      │ │ tem?           │ │  ┌──────────┐  │
│  ingrediente.  │ │ ┌────┐ ┌────┐  │ │  │ 20 gotas │  │
│                │ │ │ Mg │ │ Ca │  │ │  │  = 1 mL  │  │
│  Salis calcula │ │ └────┘ └────┘  │ │  └──────────┘  │
│  as gotas; a   │ │ ┌────┐ ┌────┐  │ │  Conte quantas │
│  Juliana ensi- │ │ │KHCO│ │NaHC│  │ │  gotas enchem  │
│  na o porquê.  │ │ └────┘ └────┘  │ │  1 mL na serin-│
│                │ │ ┌────┐ ┌────┐  │ │  ga e ajuste.  │
│                │ │ │CaSO│ │MgCl│  │ │                │
│   ● ○ ○        │ │ └────┘ └────┘  │ │  [−]  20  [+]  │
│                │ │ Nenhum ainda → │ │                │
│ [ Começar ]    │ │ [ Continuar ]  │ │ [ Pronto ]     │
└────────────────┘ └────────────────┘ └────────────────┘
            (empty grid → last screen becomes "Comece pelo Mg" + button to its prep recipe)
```

**S1 · Receitas (home)** — sensory name first, what's missing second, chemistry last.

```
┌─────────────────────────────────────┐
│ Salis                           ⚙    │
│                                      │
│ Receitas da Juliana  ·  Minhas (0)   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Mais doce                 ┌──┐   │ │
│ │ Realça doçura e corpo     │ ·│   │ │
│ │ em cafés lavados          └──┘   │ │
│ │ GH 124 · KH 25        ✓ tudo ok  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Mais brilhante            ┌──┐   │ │
│ │ Acidez viva, corpo leve   │· │   │ │
│ │ GH 90 · KH 15      ◇ falta 1      │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Equilibrada  [espresso ok] ┌──┐  │ │
│ │ Referência SCA, sem cloreto│ ·│  │ │
│ │ GH 100 · KH 40    ◇ falta 2      │ │
│ └──────────────────────────────────┘ │
│                                      │
│          [ + Criar a partir de… ]    │
├──────────────────────────────────────┤
│  ● Receitas   ○ Concentrados  ○ Aprender │
└──────────────────────────────────────┘
```

**S2 · Receita** — the counter screen. Water amount and base water on top, drops as the hero, one GH/KH line, order at the bottom, substitution offered inside the dimmed row.

```
┌──────────────────────────────────────┐
│ ‹              Mais doce        ⋯    │
│ Realça doçura e corpo em cafés       │
│ lavados. V60, Kalita, prensa.        │
│                                      │
│ Água   [−]  1.000 mL  [+]   500 1L 2L│
│ Partida  (destilada / RO ▾)          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ◆ Mg · sulfato de magnésio       │ │
│ │   10 gotas              0,5 mL   │ │
│ ├──────────────────────────────────┤ │
│ │ ◆ Ca · cloreto de cálcio         │ │
│ │   17 gotas              0,85 mL  │ │
│ ├──────────────────────────────────┤ │
│ │ ◇ KHCO₃ · bicarb. de potássio    │ │
│ │   20 gotas              1,0 mL   │ │
│ │   Não tem. Você tem NaHCO₃:      │ │
│ │   [ Usar NaHCO₃ · 20 gotas ]     │ │
│ │   [ Preparar KHCO₃ ]             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ GH 124 · KH 25  ·  ver íons ›        │
│ ┌──────┐                             │
│ │  ·   │ doce ↔ brilhante            │
│ └──────┘ leve ↔ forte                │
│                                      │
│ Ordem: água de partida → Mg → Ca →   │
│ bicarbonato por último. Agite.       │
│                                      │
│ [ ▶ Modo preparo ]   Salvar como minha│
└──────────────────────────────────────┘
```

Tapping *Usar NaHCO₃* swaps the row in place, recomputes (still 20 gotas here, because both stocks carry 30.000 ppm of HCO₃; KH unchanged, Na added), shows Juliana's one-line note ("mais redondo, menos brilho") and marks the recipe "com substituição". Tapping *ver íons* opens a sheet with Ca, Mg, HCO₃, Na, K, Cl, SO₄ in mg/L and the TDS estimate.

**S3 · Modo preparo** — big tiles, tap to tick, screen stays on.

```
┌─────────────────────────────────────┐
│ ✕   Mais doce · 1.000 mL             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ✓  Mg                    10 gotas│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │    Ca · cloreto de cálcio        │ │
│ │                                  │ │
│ │          17 gotas                │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │    NaHCO₃  (substituto)  20 gotas│ │
│ │    por último                    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Agite 10 s. Pronto para usar.        │
│ [ Concluir ]                         │
└──────────────────────────────────────┘
```

**S4 · Concentrado** — Juliana's fixed recipe, a weighing checklist, the bottle label, and the toggle that unlocks rows everywhere.

```
┌─────────────────────────────────────┐
│ ‹    KHCO₃ · bicarbonato de potássio │
│                                      │
│ Fonte de alcalinidade (KH). Arredon- │
│ da a acidez; em excesso apaga o      │
│ brilho. Usado em 3 receitas.         │
│                                      │
│ Rende 500 mL  ·  30.000 ppm HCO₃     │
│ ┌──────────────────────────────────┐ │
│ │ ☐  24,6 g  KHCO₃ grau alimentar   │ │
│ │ ☐  500 mL  água destilada ou RO   │ │
│ └──────────────────────────────────┘ │
│ 1. Pese o sal (balança 0,1 g).       │
│ 2. Dissolva em 300 mL, agite 1 min.  │
│ 3. Complete até 500 mL.              │
│ 4. Frasco conta-gotas, longe da luz. │
│                                      │
│ Etiqueta  ┌────────────────────────┐ │
│           │ KHCO₃ 30.000 · 20/10/26│ │
│           └────────────────────────┘ │
│ Validade 3 meses · Onde comprar ›    │
│                                      │
│ [ ✓ Tenho este concentrado ]         │
└──────────────────────────────────────┘
```

**S5 · Concentrados (tab)** — inventory, prep dates, what each one unlocks.

```
┌──────────────────────────────────────┐
│ Concentrados                         │
│                                      │
│ Tenho (3)                            │
│ ◆ Mg  sulfato de magnésio   03/10    │
│ ◆ Ca  cloreto de cálcio     12/09  ⚠ vence 12/12
│ ◆ NaHCO₃ bicarb. de sódio   15/10    │
│                                      │
│ Ainda não tenho (3)                  │
│ ◇ KHCO₃   libera 2 receitas   ›      │
│ ◇ CaSO₄   substitui Ca p/ espresso › │
│ ◇ MgCl₂   substitui Mg        ›      │
└──────────────────────────────────────┘
```

**S6 · Minha receita (builder, por concentrados)** — start from a preset, move drops, watch the dot. Ion-target input is not in v1.

```
┌──────────────────────────────────────┐
│ ‹ Cancelar   Minha receita    Salvar │
│ Nome  [ Geisha domingo            ]  │
│ Base  (Mais doce ▾)   por litro      │
│                                      │
│ Mg       [−]  10 → 8   [+]           │
│ Ca       [−]  17 → 22  [+]           │
│ KHCO₃    [−]  20 → 14  [+]           │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  forte                           │ │
│ │  doce ──┼──○───●── brilhante     │ │
│ │  leve                            │ │
│ └──────────────────────────────────┘ │
│ GH 126 · KH 17   (era 124 · 25)      │
│ Mais brilhante e um pouco mais       │
│ forte que a base.                    │
│ ⚠ KH abaixo de 20: pode ficar ácida. │
└──────────────────────────────────────┘
```

**Aprender (tab)** is static content from Juliana rendered as short lessons: why water comes first, how to prepare concentrates safely, how to read the plane (with all presets plotted), where to buy salts in Brazil, FAQ. No wireframe needed; it is a list of articles.

## What Juliana supplies

Everything a student sees except their own inventory and saved recipes is Juliana's content. In v1 she fills a structured spreadsheet (one tab per entity, template provided by us) and the app imports it; the admin UI comes after the beta proves the content model is right. This keeps her out of developer tools without spending beta weeks on forms nobody has validated.

| Entity | Fields she fills | What the app derives |
| --- | --- | --- |
| Mineral (sal) | name PT, formula with hydrate (MgSO₄·7H₂O), ion it supplies, sensory note (one line), where to buy in Brazil (link), espresso-safe flag | ion mass fraction from the formula; mg of ion per gram of salt |
| Concentrate | mineral, grams of salt, mL of water, shelf life, storage note, label text | ion mg/mL and mg per drop (with the user's gotas/mL); the printed prep recipe |
| Water recipe (preset) | name, sensory promise (one line), target ions in mg/L, which concentrates to use, brew methods, espresso-safe flag, plane coordinates (optional override) | drops per litre, GH/KH, TDS estimate, default coordinates from the formula, "falta N" per user |
| Equivalence rule | mineral A → mineral B, ion shared, one-line note on what changes in the cup, espresso note | the conversion factor (from both formulas); the in-row offer when A is missing and B is owned |
| Base water | name (Destilada/RO, Crystal, Minalba…), Ca, Mg, HCO₃, Na in mg/L from the label | the delta each recipe needs from that base; a "não alcança" warning when the base already exceeds a target |
| Guard | Ca + HCO₃ precipitation threshold, KH floor and ceiling for the builder warnings | warnings on S2 and S6 |
| Lesson | title, body (markdown), order | the *Aprender* list |

Before launch she needs to deliver, at minimum: 6 minerals, 6 concentrates, 4–6 presets, the equivalence rules she teaches, 2–3 bottled-water profiles, the guards, and 5 lessons. The plane coordinates she can leave blank; the formula fills them and she overrides after seeing the chart.

Two decisions in this table are hers alone and block the calculator: the concentrate convention (ppm of the ion vs. of the salt) and whether the course standardises a dropper. Both are in the open questions.

## Calculation rules

One formula produces every drop count; the concentrate's ion yield is the only number that depends on Juliana's convention.

```latex
\text{gotas} = \frac{(C_{alvo} - C_{base})\ [\text{mg/L}] \times V\ [\text{L}]}{y\ [\text{mg de íon por gota}]}, \qquad y = \frac{m_{sal}\ [\text{g}] \times f_{íon} \times 1000}{V_{conc}\ [\text{mL}]} \times v_{gota}\ [\text{mL}]
```

Worked example: 49,2 g KHCO₃ in 1.000 mL, HCO₃ fraction 0,61, so 30 mg HCO₃ per mL and 1,5 mg per 0,05 mL drop; a 30 mg/L target in 1 L is 20 gotas. If Juliana's 30.000 ppm instead means 30 g of *salt* per litre, the same bottle holds 18,3 mg/mL and the recipe needs 33 gotas. That is why the convention is question one.

| Rule | Behaviour |
| --- | --- |
| Drop volume | Default 0,05 mL (20 gotas/mL), set in onboarding, editable in Ajustes; a change recomputes everything and says so once. |
| Display units | GH and KH as CaCO₃ on cards and the summary line (Ca × 2,5 + Mg × 4,1; HCO₃ × 0,82). Ions in mg/L behind *ver íons*. TDS shown as "estimativa" and never compared to a meter. |
| Rounding | Nearest whole drop. Under 3 gotas the row shows mL first ("0,1 mL na seringa"). Over 60 gotas the row shows mL first and the concentrate screen suggests a stronger stock. |
| Base water | Delta = target − base, clamped at 0. If any clamp fires, the row says "já presente na água de partida" and the GH/KH line reflects the real total. |
| Substitution | Drops of B = drops of A × (y\_A / y\_B) on the shared ion. The note from the rule is shown; counter-ions change the TDS estimate and the ion sheet. Offered only when B is in the inventory; otherwise the prep CTA. |
| Guards | Ca + HCO₃ above Juliana's threshold → precipitation warning on S2 and S6. KH below her floor → "pode ficar ácida"; above her ceiling → "pode ficar chata". Chloride-bearing concentrate in a recipe → no *espresso ok* badge. |
| Mixing order | Fixed text on S2 and enforced as tile order in S3: base water, Mg, Ca, bicarbonate last, shake. |
| Plane coordinates | x = (0,5 − KH/GH) / 0,35 − Na/80 + 0,3 (Ca share − 0,5); y = (GH − 80) / 80; both clamped to ±1. Juliana's override wins when present. Custom recipes always use the formula. |
| Shelf life | Prep date + shelf life from the concentrate; past it, the inventory row and every recipe row carry ⚠ but still compute. |
| Offline | Juliana's content is cached on first load and refreshed in the background; the calculator never needs the network. |

**States**

- No inventory: every row dimmed, one banner "Comece pelo Mg" linking to its prep recipe. The recipe still shows its drops.
- Empty *Minhas receitas*: a single card that opens S6 with "Mais doce" as base.
- Preset updated by Juliana after a user copied it: the copy keeps its drops and gets a "base atualizada" chip.
- Substitution applied: the recipe title carries "com substituição" and S3 labels the tile "(substituto)".

## Scope

The cut: anything a student needs to make Juliana's water correctly is in; anything that needs an account, a payment or an admin form is out until the beta has run.

| In v1 | Why |
| --- | --- |
| Receitas tab: presets, S2 calculator, S3 modo preparo | the core loop |
| Concentrados tab: catalogue, prep recipes, inventory with prep dates and shelf life | the first job, and what drives every dimmed row |
| In-row substitution from Juliana's rules | spec requirement; cheap once ion yields exist |
| Base-water chip with Juliana's bottled profiles | the fourth most common complaint in the market; a subtraction |
| Static sensory plane on cards and S2 | spec requirement; formula + override |
| Espresso-ok badge | one flag per recipe; protects students' machines |
| Onboarding with inventory grid and drop calibration | the biggest accuracy lever |
| S6 builder by drops, saved locally | spec "usuários avançados"; no ion input |
| Aprender tab, static lessons | the moat; zero logic |
| Spreadsheet import of Juliana's content | gets content in without an admin UI |
| Installable mobile web app (PWA), offline, desktop as a centred column | mobile-first per spec, no store review during beta |
| Closed access by código da turma, state on device | free for first turmas; no auth to build |

| Out of v1 | Lands in |
| --- | --- |
| Accounts, sync, recipe sharing between students | v1.1, once students ask for it |
| Admin UI for Juliana | v1.1, after the content model survives the beta |
| Builder by ion targets | v1.1 |
| Interactive plane (drag → recipe) | premium |
| LSI / scale-corrosion calculator | later; the espresso badge covers the common case |
| Payments, premium gating | after the free turmas validate |
| Native iOS/Android wrappers | only if the PWA fails in the beta |
| Community recipe library | later; Cafelytic and BrewWater show demand, not urgency |

Tech assumption so the build order makes sense: React + TypeScript PWA, content as versioned JSON generated from Juliana's spreadsheet, state in local storage, no backend beyond static hosting until v1.1.

## Build order

The mistake to avoid is the one this project almost made in planning: screens before the numbers. Phase 1 has no UI at all; it ends when the calculator reproduces Juliana's spreadsheet and the Barista Hustle and Rao recipes from the research. No dates yet; each phase ends at its gate, not on a calendar.

```
 1 Conteúdo e motor      2 Loop principal        3 Camadas               4 Beta com a turma
 planilha da Juliana     onboarding, S1 a S5     substituir na linha     link para a turma 1
 import para JSON        inventário, offline     água base e plano       eventos simples
 motor de gotas          modo preparo            badge espresso, S6      feedback semanal
 testes com receitas                             Aprender                correções
 ──────────────────      ──────────────────      ──────────────────      ──────────────────
 gate: gotas batem com   gate: 3 alunos fazem    gate: Juliana aprova    gate: 70% fez água na
 a planilha da Juliana   água sem ajuda          telas e textos          semana 2, decide v1.1
```

Each gate is a test a person runs, not a checklist: phase 1 ends with Juliana's numbers and ours agreeing; phase 2 with a hallway test on three people who did the course; phase 3 with Juliana reading every string; phase 4 with the one metric the beta exists for.

What each phase produces:

1. **Conteúdo e motor.** The spreadsheet template; Juliana's first fill; an import script to versioned JSON; a pure TypeScript dosing engine (ion yields, deltas, substitution, GH/KH, plane coordinates, guards) with tests against her presets and the published recipes. The design system you already have is not touched.
2. **Loop principal.** Onboarding, S1–S5 on the design system, local inventory, offline caching, modo preparo with wake lock. Substitution rows show only the "Preparar" path in this phase.
3. **Camadas.** In-row substitution, base-water chip, plane thumbnails and the full chart, espresso badge, S6 builder, Aprender rendering. Every string reviewed by Juliana against her course vocabulary.
4. **Beta com a turma.** Link plus código da turma; a handful of events (recipe opened, modo preparo completed, concentrate marked, substitution used); a weekly call with Juliana; fixes. The v1.1 decision (accounts, admin UI, ion builder) is made on what students actually did.

## Open questions and risks

The first two questions block phase 1; the rest can be answered while it runs.

- [ ] **Concentrate convention.** Is "30.000 ppm" the ion or the salt? Same bottle, 1,6× different drop counts.
- [ ] **Dropper.** Does the course ship or name a conta-gotas? If yes, fix gotas/mL and drop the calibration screen.
- [ ] **Presets for launch.** Names, one-line promises, target ions, brew methods, which are espresso-safe.
- [ ] **Substitution rules.** The list she teaches, with her note for each.
- [ ] **Bottled water.** Which 2–3 brands her students actually buy, with label values.
- [ ] **Guards.** Her precipitation threshold and KH floor/ceiling.
- [ ] **Plane.** Accept the formula with per-recipe override, or place every preset by hand?
- [ ] **Display unit.** GH/KH as CaCO₃ on screen (recommended) or ion mg/L? Whatever her slides use.
- [ ] **Access.** Código da turma with device-only state, or does she need to see who is using it?
- [ ] **Crivelo.** The transcription cites it as the layout reference for saved recipes; a link lets us match it where it helps.

| Risk | Why it matters | Mitigation in this plan |
| --- | --- | --- |
| Drop counts drift from reality (dropper, hydrate, convention) | the app's only job is a correct number | calibration on day one; hydrate named on every concentrate; phase 1 gate against Juliana's own sheet |
| Students never prepare the first concentrate | nothing works without it | onboarding routes empty inventories to the prep recipe; "Comece pelo Mg" banner; label text and "Onde comprar" on S4 |
| Content arrives late or inconsistent | phase 1 cannot end | spreadsheet template with validation; minimum content list in "What Juliana supplies" |
| Substitution rules produce odd cups | trust in the app, and in the course | offered only from her rules, with her note; marked "com substituição" on the recipe |
| Espresso users scale a boiler | real money | espresso badge from her flag; chloride recipes never get it |
| Device-only state loses a student's recipes | annoyance, not blockage | export/import of local state as a file in v1; sync in v1.1 |
| PWA install friction on iOS | fewer daily opens | a 20-second "adicionar à tela inicial" lesson in Aprender and in the turma message |

Research, market comparison and sources live in [Salis — UX Flow & Wireframes](https://claude.ai/code/artifact/8222c968-b4c7-4557-a502-a1ac6c641fe9).
