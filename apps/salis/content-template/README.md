# Content template

The spreadsheet Juliana fills, one file per tab, and the column reference for
each. Export every tab as CSV into this folder, then run:

```bash
pnpm --filter salis import:content
```

That validates the sheet and writes `content/content.json`, which the app loads
once and caches for offline. **Nothing numeric is typed by hand** — molar
masses, ion mass fractions, mg of ion per mL, GH/KH, TDS and plane coordinates
are all derived from the formula in the `Sais` tab.

The rows shipped here are a working example so the importer runs green on day
one. Replace them with real content; keep the header rows exactly as they are.

## Export settings

| Setting | Value | Why |
| --- | --- | --- |
| Encoding | UTF-8 | `ã`, `ç`, `·` must survive. A BOM is fine — the importer strips it. |
| Delimiter | `;` (semicolon) | The comma is the decimal separator in pt-BR. |
| Decimals | comma — `2,45` | As typed in a Brazilian spreadsheet. `30.000` is also read as thirty thousand. |
| Booleans | `sim` / `não` | `true`/`false`/`x`/`1` also work. Anything else is rejected rather than assumed. |
| Lists | comma-separated inside one cell | e.g. `V60, Kalita, prensa`. Quote the cell. |

Cells containing `;`, a line break or a quote must be wrapped in `"…"`, which is
what every spreadsheet does automatically. `steps_pt` and `body_md` rely on this.

## Tabs

| File | Tab | Holds |
| --- | --- | --- |
| `minerals.csv` | `Sais` | every salt, with its full hydrate formula |
| `concentrates.csv` | `Concentrados` | grams of salt in a volume of water |
| `recipes.csv` | `Receitas` | the presets, as ion targets in mg/L |
| `equivalences.csv` | `Substituições` | which salt may stand in for which |
| `base_waters.csv` | `Águas de partida` | bottled-water profiles from the label |
| `guards.csv` | `Limites` | the warning thresholds |
| `lessons.csv` | `Aprender` | the lessons, as markdown |

## Rules the importer enforces

It reports **every** problem at once rather than stopping at the first, and
writes nothing when there is an error.

**Errors** (nothing is written):

- every id is unique; every reference resolves; every enum is in range
- `formula` parses, and actually contains both the `ion` and the `counter_ion`
  it claims — an unknown element is rejected rather than silently weighed zero
- a recipe lists a concentrate for every ion it targets, and targets every ion
  its concentrates supply (either mismatch means a row that doses nothing)
- `shared_ion` on a substitution is the `ion` of both minerals
- a base water `destilada` exists and is all zeros
- `plane_x`/`plane_y` are given together and sit within [−1, 1]
- every guard key is present, the KH floor is below the ceiling, and the drop
  thresholds are ordered

**Warnings** (imported anyway, so Juliana can override knowingly):

- a recipe marked `espresso_safe` that uses a chloride-bearing salt — the app
  withholds the badge regardless
- a substitution whose target mineral has no concentrate, so the in-row swap can
  never be offered

## Columns

### `minerals.csv` → `Sais`

| Column | Example | Notes |
| --- | --- | --- |
| `id` | `mgso4-7h2o` | stable slug; referenced by concentrates and rules |
| `name_pt` | Sulfato de magnésio (sal de Epsom) | |
| `formula` | `MgSO4·7H2O` | **the full hydrate.** `·`, `*` and `.` all work as the separator |
| `ion` | `Mg` | one of `Ca` `Mg` `HCO3` `Na` `K` |
| `counter_ion` | `SO4` | one of `Cl` `SO4` `HCO3` `citrate` `none` |
| `sensory_note` | one line, her words | quote it if it contains `;` |
| `espresso_safe` | `não` | `não` for chloride-bearing salts |
| `buy_url` | | optional |

Getting the hydrate right is the single highest-stakes cell in the sheet:
`MgSO4` is 20,2 % magnesium but `MgSO4·7H2O` is 9,9 %, so the wrong one doubles
every drop count.

### `concentrates.csv` → `Concentrados`

| Column | Example | Notes |
| --- | --- | --- |
| `id` | `mg-30k` | |
| `mineral_id` | `mgso4-7h2o` | |
| `label_pt` | Mg 30.000 | what the student writes on the bottle |
| `salt_g` | 152,1 | grams of the hydrate named above |
| `water_ml` | 500 | final volume |
| `shelf_life_days` | 90 | |
| `storage_note` | Frasco conta-gotas, longe da luz. | |
| `steps_pt` | `1. Pese…` | newline-separated; quote the cell |

Strength is **not** a column. It is derived:
`ion_mg_per_ml = salt_g × ion_mass_fraction × 1000 / water_ml`. Writing grams
and millilitres instead of a ppm figure is what keeps the sheet honest no matter
which way the "30.000 ppm" question is answered.

### `recipes.csv` → `Receitas`

| Column | Example | Notes |
| --- | --- | --- |
| `id` | `mais-doce` | |
| `name_pt` | Mais doce | |
| `promise_pt` | Realça doçura e corpo em cafés lavados. | one line |
| `methods` | `V60, Kalita, prensa` | |
| `target_Ca` … `target_K` | 25 / 15 / 30 / 0 / 0 | **mg/L of the ion**; blank = 0 |
| `concentrate_ids` | `mg-30k, ca-30k, khco3-30k` | **in mixing order, bicarbonate last** |
| `espresso_safe` | `não` | her call; chloride still withholds the badge |
| `plane_x`, `plane_y` | | optional override in [−1, 1]; blank = use the formula |
| `level` | `iniciante` | `iniciante` or `avançado` |

### `equivalences.csv` → `Substituições`

| Column | Example |
| --- | --- |
| `from_mineral_id` | `khco3` — what the recipe asks for |
| `to_mineral_id` | `nahco3` — what the student has |
| `shared_ion` | `HCO3` — must be the `ion` of both |
| `note_pt` | Mais redondo, menos brilho; adiciona sódio. |
| `espresso_note_pt` | optional |

### `base_waters.csv` → `Águas de partida`

`id`, `name_pt`, then `Ca`, `Mg`, `HCO3`, `Na`, `K` in mg/L from the label, plus
`source` (which label, which year). `destilada` must exist with every value at
zero and is the default.

### `guards.csv` → `Limites`

A flat `key;value` sheet. All six keys are required:

| Key | Example | Used for |
| --- | --- | --- |
| `precip_ca_hco3_product` | 2000 | warn when Ca × HCO3 exceeds it |
| `kh_floor_caco3` | 20 | "pode ficar ácida" |
| `kh_ceiling_caco3` | 75 | "pode ficar chata" |
| `drops_show_ml_below` | 3 | lead the row with mL |
| `drops_show_ml_above` | 60 | lead with mL and flag |
| `default_drops_per_ml` | 20 | onboarding default |

### `lessons.csv` → `Aprender`

`id`, `order` (int), `title_pt`, `body_md` (markdown; quote the cell so the line
breaks survive).
