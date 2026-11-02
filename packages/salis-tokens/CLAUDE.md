# CLAUDE.md — @salis/tokens

Tier-1 design foundation for `apps/salis`. Salis **replaces** the Crivelo house
rather than overriding its accent, because the brand differs at Tier 1, not Tier 2:

| | `@crivelo/tokens` | `@salis/tokens` |
| --- | --- | --- |
| Neutrals | warm (espresso / crema) | cool slate with a teal cast |
| Brand | espresso ink, per-app accent | deep teal `--teal-700` (brand *and* commit colour) |
| Dark theme | none | full `[data-theme="dark"]` semantic swap |
| Type | Bricolage / Instrument Serif / Geist / Geist Mono | Source Sans 3 + IBM Plex Mono |
| Radii | 6 / 10 / 18 / 28 | 4 / 6 / 10 / 14 / 20 / 24 ("modest, precise") |

So `apps/salis/app/globals.css` imports **this** foundation, never
`@crivelo/tokens/styles/foundation.css`. The two are mutually exclusive — do not
import both.

Source of truth: the Salis Claude Design handoff (`claude.ai/design`), kept
gitignored at `apps/salis/.design/`. Ships raw `.ts`/`.css` (no build), like
`@crivelo/tokens`.

## What `@crivelo/ui` still gives us (and why)

Salis keeps Crivelo's **semantic token vocabulary** — `--bg` / `--bg-2` / `--bg-3`
/ `--surface*` / `--fg` / `--fg-2` / `--fg-3` / `--fg-4` / `--fg-muted` /
`--fg-inverse` / `--border*` / `--brand*` / `--focus-ring` / `--danger*` /
`--radius-*` / `--shadow-1,2` / `--ease-standard` / `--font-*`.

That is the whole trick: `@crivelo/ui`'s shadcn bridge
(`packages/ui/src/styles/shadcn-theme.css`) aliases shadcn's vocabulary onto
exactly those names (`--background: var(--bg)`, `--primary: var(--brand)`,
`--ring: var(--focus-ring)`, `--radius: var(--radius-md)`, …). Define them and
every shared primitive renders in Salis teal with **zero** per-app shadcn config.
A token the bridge reads that this foundation fails to define is a real bug —
the primitive silently falls back to an invalid value.

## Hard rule: never declare `--secondary` or `--accent`

The design handoff names mineral blue `--secondary` and honey `--accent`. **Both
names are claimed by the shadcn bridge for neutral fills** (`--secondary:
var(--bg-2)`, `--accent: var(--bg-3)`), and the bridge imports LAST — so
declaring the brand hues there would be silently overwritten and every
blue/honey surface would render grey.

Salis's brand hues therefore live under collision-free names:

- mineral blue (links, toggles, selected presets, secondary buttons) → `--mineral`, `--mineral-hover`, `--mineral-press`, `--mineral-soft`, `--mineral-soft-ink`, `--link`
- honey (the sweet end of the sensory plane, accent badges) → `--sweet`, `--sweet-soft`, `--sweet-ink`

When translating a handoff value, map the name as well as the colour.

## Colour rules that carry meaning

- **Honey is not a UI colour.** It marks the *sweet* end of the sensory plane and
  accent badges. Never a button, never a warning — warning is its own orange.
- **The palette encodes the plane.** Horizontal axis runs honey → grey → blue
  (doce → brilhante); vertical runs `--teal-200` → `--teal-800` (leve → forte).
  The `--axis-*` / `--plane-*` tokens exist so the chart never hardcodes a hue.
- **Dark theme inverts the brand** to `--teal-300` so it stays legible on
  near-black, which is why `--fg-inverse` flips to near-black there: primary
  buttons are light-on-dark in that theme.

## Type

Quantities are the largest thing on a screen. The mono "data" scale
(`text-data-hero` 56px → `text-data-xs` 12px) is for every number; the sans scale
is for words. `--font-mono-features` (`tnum`, `zero`) is not optional — drop
counts must not shift width as they recompute, and `0`/`O` must be unmistakable
on a wet-handed counter screen.

Tailwind's numeric scale (`text-sm`/`text-base`/…) is deliberately left intact:
the shared `@crivelo/ui` primitives are authored against it. The Salis named
sizes are added alongside, never as a replacement.

## Fonts

`fonts/index.ts` loads both faces via `next/font/local` under the variable names
`--font-body` / `--font-mono` (the same names the foundation declares with
literal stacks) — next/font shadows the literals on `<body>`. Only the **latin**
woff2 subsets are loaded; that is complete for pt-BR. See the module header for
the one out-of-range glyph (U+207A, the superscript plus in "Mg²⁺").

## Verify

Utilities only generate on a Tailwind v4 pipeline with `@import "tailwindcss"`
ordered *before* `theme.css`. Imported bare or out of order the `@theme` block is
silently ignored and no utilities appear — if `bg-brand` renders unstyled, check
the import order in `apps/salis/app/globals.css` first.
