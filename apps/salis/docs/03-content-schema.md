# Content schema

What Juliana fills (one spreadsheet tab per entity) and what the app consumes (`content/*.json`). The import script validates the sheet and emits the JSON; derived fields are computed at import time so the app never recomputes chemistry from formulas at runtime.

All ion concentrations are **mg/L of the ion** unless a field name says otherwise. Decimal separator in the sheet is a comma (Brazilian locale); the importer normalises.

## minerals (tab `Sais`)

| Column | Type | Example | Notes |
| --- | --- | --- | --- |
| id | slug | `mgso4-7h2o` | stable; referenced by concentrates and rules |
| name_pt | text | Sulfato de magnésio (sal de Epsom) | |
| formula | text | `MgSO4·7H2O` | full hydrate; the importer parses it for molar mass |
| ion | enum | `Mg` | one of Ca, Mg, HCO3, Na, K |
| counter_ion | enum | `SO4` | one of Cl, SO4, HCO3, citrate, none |
| sensory_note | text | Corpo e complexidade; em excesso, doçura enjoativa | one line, Juliana's words |
| espresso_safe | bool | true | false for chloride-bearing salts |
| buy_url | url | | optional |

Derived at import: `molar_mass`, `ion_mass_fraction` (mg of ion per mg of salt), `counter_ion_mass_fraction`, `ion_as_caco3_factor` (2.497 for Ca, 4.118 for Mg, 0.820 for HCO3, 0 otherwise).

## concentrates (tab `Concentrados`)

| Column | Type | Example | Notes |
| --- | --- | --- | --- |
| id | slug | `mg-30k` | |
| mineral_id | ref | `mgso4-7h2o` | |
| label_pt | text | Mg 30.000 ppm | what the student writes on the bottle |
| salt_g | number | 24,6 | grams weighed |
| water_ml | number | 500 | final volume |
| shelf_life_days | int | 90 | |
| storage_note | text | Frasco conta-gotas, longe da luz | |
| steps_pt | text | 1. Pese… 2. Dissolva… | newline-separated |

Derived: `ion_mg_per_ml = salt_g × ion_mass_fraction × 1000 / water_ml`. Drops are computed at runtime from `ion_mg_per_ml × v_gota`, because `v_gota` is per device.

## recipes (tab `Receitas`)

| Column | Type | Example | Notes |
| --- | --- | --- | --- |
| id | slug | `mais-doce` | |
| name_pt | text | Mais doce | |
| promise_pt | text | Realça doçura e corpo em cafés lavados | one line |
| methods | list | V60, Kalita, prensa | |
| target_Ca, target_Mg, target_HCO3, target_Na, target_K | number | 25 / 15 / 30 / 0 / 0 | mg/L; blank = 0 |
| concentrate_ids | list | `mg-30k, ca-30k, khco3-30k` | which bottles this recipe uses, in mixing order |
| espresso_safe | bool | false | Juliana's call; importer warns if a chloride concentrate is listed and this is true |
| plane_x, plane_y | number | | optional override in [−1, 1]; blank = formula |
| level | enum | iniciante | iniciante / avançado |

Derived: `gh_caco3`, `kh_caco3`, `tds_estimate`, `plane` (formula unless overridden), per-concentrate `target_ion_mg_per_l`.

## equivalences (tab `Substituições`)

| Column | Type | Example | Notes |
| --- | --- | --- | --- |
| from_mineral_id | ref | `khco3` | the one the recipe asks for |
| to_mineral_id | ref | `nahco3` | the one the student has |
| shared_ion | enum | `HCO3` | must be the `ion` of both minerals; importer checks |
| note_pt | text | Mais redondo, menos brilho; adiciona sódio | shown in the row |
| espresso_note_pt | text | | optional |

Derived: `factor = ion_mass_fraction(from) / ion_mass_fraction(to)` applied to salt mass; at runtime drops of B = target ion ÷ y_B, which already accounts for it.

## base_waters (tab `Águas de partida`)

| Column | Type | Example |
| --- | --- | --- |
| id | slug | `destilada` |
| name_pt | text | Destilada / RO |
| Ca, Mg, HCO3, Na, K | number | 0 |
| source | text | rótulo 2026 |

`destilada` with all zeros must exist and is the default.

## guards (tab `Limites`, key/value)

| Key | Example | Used by |
| --- | --- | --- |
| precip_ca_hco3_product | 2000 | warn when Ca × HCO3 (mg/L²) exceeds |
| kh_floor_caco3 | 20 | "pode ficar ácida" |
| kh_ceiling_caco3 | 75 | "pode ficar chata" |
| drops_show_ml_below | 3 | rounding rule |
| drops_show_ml_above | 60 | rounding rule |
| default_drops_per_ml | 20 | onboarding default |

## lessons (tab `Aprender`)

| Column | Type |
| --- | --- |
| id | slug |
| order | int |
| title_pt | text |
| body_md | markdown |

## Importer validations (fail the build)

- every `ref` resolves; every `enum` is in range
- a concentrate's mineral `ion` matches the recipe target it is listed for
- equivalence `shared_ion` equals both minerals' `ion`
- `destilada` base water exists and is all zeros
- a recipe marked `espresso_safe` lists no concentrate whose mineral has `counter_ion = Cl` (warning, not error, so Juliana can override knowingly)
- formulas parse to a molar mass; unknown element → error

## Output

`content/content.json` with `{ version, generated_at, minerals, concentrates, recipes, equivalences, base_waters, guards, lessons }`. The app loads it once, caches it for offline, and refreshes in the background when `version` changes.
