# Content assumptions

`content-template/` is filled with **researched defaults, not Juliana's content**. The
point is a testable app today; every value here is meant to be overwritten by
hers. This file records what we chose, why, what it is sourced to, and what
changes when she answers.

Nothing in `engine/` or `scripts/` depends on any of these values — they are all
data. Changing a number here changes the app; it never changes code.

> **Status of each item:** ✅ settled by evidence · 🟡 defensible default, her call ·
> 🔴 known gap, needs her or a physical check

---

## 1. ✅ "30.000 ppm" means ppm **of the ion**

This was open question 1 and it is now settled by arithmetic, not opinion.

Three readings were possible. The app's own rounding guard (`drops_show_ml_above`
= 60) rules out two of them, because a concentrate that needs more than 60 drops
for a normal dose is, by the spec's own definition, too weak:

| Reading | g per 250 mL (Mg) | Drops for a normal Mg dose, 1 L | Verdict |
| --- | --- | --- | --- |
| **ppm of the ion** | 76,1 g | **3–19** | ✅ every salt usable |
| ppm as CaCO₃ | 18,5 g | 14–77 | 3 salts over the ceiling |
| ppm of the salt | 7,5 g | **34–189** | 4 salts over the ceiling |

Corroborated three ways:

- it reproduces `docs/01` § Screens exactly — its S4 screen says *24,6 g KHCO₃ →
  500 mL → 30.000 ppm HCO₃*, which **is** 30.000 mg of bicarbonate ion per litre;
- **Lotus Water**, the only commercial drop-dosed product, delivers 10 ppm GH per
  drop in 450 mL — an implied stock of ~22.000 ppm **of the ion**, the same order
  as our 30.000;
- the "as salt" reading would need **189 drops** of magnesium for a strong recipe.

**Caveat worth knowing.** Published *gram* recipes (Barista Hustle, Rao/Perger,
EspressoAF) all express strength as **ppm as CaCO₃**, never as ion. If Juliana's
"30.000 ppm" came from that lineage, her grams differ from ours — the engine
tracks it either way through `salt_g` + `water_ml`, and only this table changes.
`engine/__tests__/dosing.test.ts` asserts both readings of the same bottle.

## 2. ✅ Concentrates are 250 mL, not 500 mL

At 30.000 ppm of the ion, a 500 mL magnesium bottle needs **152 g** of Epsom.
Halving the bottle halves the weighing without touching the strength, and a
250 mL bottle still holds ~5.000 drops — roughly 250 L of brewing water, far
beyond the 90-day shelf life. `docs/01`'s S4 screen shows 500 mL; this is a
deliberate, reversible departure.

| Concentrate | Salt | g per 250 mL | Stock g/L | Solubility | Headroom |
| --- | --- | --- | --- | --- | --- |
| Mg 30.000 | MgSO₄·7H₂O | 76,1 | 304 | ~710 g/L | 2,3× |
| Ca 30.000 | CaCl₂·2H₂O | 27,5 | 110 | ~985 g/L | 9× |
| KHCO₃ 30.000 | KHCO₃ | 12,3 | 49 | 224 g/L | 4,5× |
| NaHCO₃ 30.000 | NaHCO₃ | 10,3 | 41 | **96 g/L** | 2,3× |
| MgCl₂ 30.000 | MgCl₂·6H₂O | 62,7 | 251 | ~1.155 g/L | 4,6× |

**Sodium bicarbonate is the binding constraint on the whole system.** At 96 g/L it
is by far the least soluble of the five, and its solubility *falls steeply below
20 °C* — a near-saturated stock crystallises in a cold kitchen. This is why the
bicarbonate stocks cannot simply be made stronger to fix the 2-litre drop counts
below.

Sources: CRC via Wikipedia for each salt; the CaCl₂ and MgCl₂ hydrate figures are
converted from anhydrous CRC values rather than directly sourced — flagged by the
researcher, and both have so much headroom it does not matter.

## 3. 🟡 Known behaviour: 2-litre batches lead with mL for bicarbonate

| Preset | 1 L | 2 L |
| --- | --- | --- |
| Equilibrada | Mg 7 · Ca 11 · KHCO₃ 33 | KHCO₃ **65 → shows mL** |
| Mais doce | Mg 12 · Ca 5 · NaHCO₃ 40 | NaHCO₃ **80 → shows mL** |
| Encorpada | Mg 19 · Ca 10 · NaHCO₃ 50 | NaHCO₃ **100 → shows mL** |

This is the `drops_show_ml_above` guard working as designed — at 80 drops, "4,0 mL
na seringa" is genuinely the better instruction. It **cannot** be fixed with a
stronger bicarbonate stock (see the solubility ceiling above), so the honest
options are to accept it, or to raise the threshold. Her call.

## 4. ✅ The dropper must stay calibrated — do not hardcode 20 gotas/mL

Open question 2. The answer is clear and it is *no*:

- USP/NF defines a medicine dropper as 20 drops ± 10 % per mL **for water only**.
- **Farmacopeia Brasileira requires per-device, per-liquid calibration** rather than
  asserting a fixed figure.
- Real Brazilian droppers span roughly **10–40 gotas/mL** (a CRF-PR bulletin
  debunking the "always 20" myth: dipirona 20, paracetamol 14–16, ibuprofeno 10,
  fenobarbital 40).
- Measured ophthalmic droppers run 25–70 µL per drop.

So the onboarding calibration screen (S0, task RMP-252) **stays**, with 20 as the
default. If Juliana ships one specific dropper with the course we can still fix
the value per-device, but the app must not assume it.

## 5. 🟡 Guard thresholds

| Key | Value | Basis |
| --- | --- | --- |
| `kh_floor_caco3` | 20 | SCA's zone starts at 40 and Barista Hustle puts thin/sour below ~34, but both describe a *preference* zone — published bright recipes sit below it (Light & Bright KH 25, Melbourne KH 12). 20 marks genuine sourness risk instead of nagging every bright recipe. |
| `kh_ceiling_caco3` | 75 | The SCA 2018 core zone's upper edge, and the most citable number available. Sources disagree widely on where water actually tastes flat (70–175). |
| `precip_ca_hco3_product` | **10000** | See below. |
| `drops_show_ml_below` / `above` | 3 / 60 | From `docs/03`. Unchanged. |
| `default_drops_per_ml` | 20 | USP water-calibrated dropper; see §4. |

**The precipitation threshold was wrong in `docs/03` and is now corrected.** No
published Ca × HCO₃ heuristic exists anywhere in the coffee literature — the
researcher looked and found none, and real precipitation depends on pH,
temperature and CO₂ equilibrium, which an app without a pH meter cannot know.
Worse, `docs/03`'s example value of **2000 fires inside the SCA's own core zone**:

```
SCA core zone corners (Ca × HCO₃, worst case all-Ca hardness)
  GH  50 KH 40 ->   977      GH 100 KH 40 ->  1954   <- 2000 fires here
  GH 175 KH 40 ->  3419      GH 175 KH 75 ->  6410
  one observed precipitation data point  -> 79200
```

GH 100 / KH 40 is the Rao/Perger recipe. A threshold of 2000 would warn on it.
**10000** sits above every SCA corner and well below the one observed
precipitation point. It is still a heuristic, not a standard — the real
protection against precipitation is structural and already in the design:
calcium and bicarbonate never meet at stock strength (separate bottles), and
bicarbonate goes in last.

Also worth noting for the espresso badge: La Marzocco publishes chloride
**0–30 ppm**, hardness 70–100, alkalinity 40–80. The widely-repeated "sulfate
above 50 ppm" could **not** be confirmed on La Marzocco's own materials.

## 6. 🟡 The five presets were redesigned

`docs/01`'s illustrative targets contradict its own plane formula: *Mais doce*
(Ca 25 · Mg 15 · HCO₃ 30) lands at **x = +0,86**, the bright end. The formula is
sound — checked against the published recipes, it puts Rao/Perger and Barista
Hustle on the sweet side, Light & Bright on the bright side, and Melbourne at the
bottom, exactly as their authors describe them. So the targets were redesigned to
land where their names say:

| Preset | Ca | Mg | HCO₃ | Bicarb | GH | KH | x | y | |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Leve | 8 | 6 | 27 | KHCO₃ | 45 | 22 | −0,00 | −0,44 | neutro / leve |
| Mais brilhante | 28 | 5 | 28 | KHCO₃ | 91 | 23 | +0,79 | +0,13 | brilhante |
| Equilibrada | 17 | 10 | 49 | KHCO₃ | 84 | 40 | +0,06 | +0,05 | neutro, SCA zone |
| Mais doce | 8 | 18 | 60 | NaHCO₃ | 94 | 49 | −0,43 | +0,18 | doce, SCA zone |
| Encorpada | 15 | 28 | 75 | NaHCO₃ | 153 | 61 | −0,15 | +0,91 | forte, SCA zone |

The mechanism worth understanding before changing them: **sweetness on this plane
comes from buffer ratio, sodium and a low calcium share.** That is why the two
sweet presets use NaHCO₃ (sodium pulls left) and lead with magnesium, while the
bright one is calcium-dominant with low buffer.

Three sit inside the SCA core zone; *Leve* and *Mais brilhante* sit deliberately
below its alkalinity floor, which is what being light and bright requires.

## 7. 🔴 Gypsum cannot be a drop-dosed concentrate — so nothing is espresso-safe yet

CaSO₄·2H₂O dissolves at only **~2,6 g/L**, around 400× less than its neighbours,
and has *retrograde* solubility (it peaks near 40 °C — heating does not help).
EspressoAF, the one coffee source that confronts this directly, recommends a
working stock of ~1,72 g/L; at that strength a normal calcium dose would need
**~70 mL per litre** of brewing water. Homebrewing practice (Bru'n Water,
Palmer) is to **weigh gypsum dry into the full volume**, not to make a stock.

Consequence, and it is a real product gap: **CaCl₂ is the only calcium stock, and
it is a chloride — so with the current salt set no recipe can earn the *espresso
ok* badge.** The CaCl₂ → CaSO₄ equivalence was removed from the template because
it could never be offered; CaSO₄ stays in the minerals tab for future dry dosing.

Three ways out, all hers: dose gypsum dry for espresso recipes; add a soluble
non-chloride calcium source (calcium lactate dissolves at ~66 g/L and is food
grade); or drop the espresso badge from v1. **Until one is chosen, task RMP-263
has nothing to show.**

## 8. 🔴 Base waters: one brand verified, the rest need a label photo

Brazilian labels are inconsistently transcribed online and genuinely vary by lot.

| Profile | Confidence | Note |
| --- | --- | --- |
| Destilada / RO | ✅ | Zero by definition. Farmacopeia Brasileira: água purificada ≤1,3 µS/cm. |
| Minalba sem gás | ✅ verified | Raw label text, cross-checked against two retailers. A second lot printed materially different values — hence "varia por lote". |
| Bonafont | 🟡 medium | Internally consistent across two secondary sources; not raw-verified. |
| Crystal | 🔴 **excluded** | Returned **three mutually incompatible** value sets — two of them on the *same page*. Also note "Crystal" (Coca-Cola) and "Fonte Crystal" are different companies; do not merge them. |
| São Lourenço, Prata, Indaiá | 🔴 excluded | Single-sourced or ~40 % internal conflicts. |

Minalba is a useful default precisely because it is *hard*: at KH 91 it already
exceeds every preset's bicarbonate target, so every row clamps to zero and the
app says "já presente na água de partida" — the base-water feature demonstrated
on real data.

**Correction to our own research doc:** `docs/02` cites an SBQ survey of 7 brands
in Itumbiara-GO (hardness 7–68 ppm as CaCO₃). That abstract **could not be found**
on re-search. The broader claim it supports — that Brazilian bottled water is soft
and that labels omit alkalinity — does hold, via Bertolo/Hirata/Fernandes (2007,
303 brands, TDS mostly <100 mg/L) and an Embrapa label study (2016, 45 brands,
half with analyses more than 3 years stale). Treat the Itumbiara citation as
unverified.

If a student buys battery water instead of pharmacy distilled: it must be the
plain "para bateria" bottle, **not** the radiator SKU, which is sometimes
pre-mixed with a corrosion inhibitor.

## 9. 🟡 Everything else

**Substitution rules** — four, in both directions, between pairs that both have a
stock: KHCO₃ ↔ NaHCO₃ and MgSO₄ ↔ MgCl₂. The notes are written in her voice but
are ours, not hers.

**Lessons** — five placeholders covering the plan's minimum (why water first, how
to prepare concentrates, calibrating the dropper, reading the plane, where to buy
in Brazil). Content is ours; all of it should be replaced with her course
material, which is the actual moat.

**Sensory notes and promises** — written to the design system's voice rules
(sentence case, full sentences, no exclamation marks, no diminutives). Hers will
be better.

---

## What to change when she answers

| Her answer | What changes |
| --- | --- |
| Grams + volume per concentrate | `concentrates.csv` only. Engine untouched. |
| A standard dropper | `default_drops_per_ml`, and S0 drops the calibration step. |
| Her preset list | `recipes.csv`. Re-check each lands where its name says. |
| Her guard limits | `guards.csv`. |
| Gypsum decision | Possibly a new mineral row, or the espresso badge leaves v1. |
| Real label photos | `base_waters.csv`. |
