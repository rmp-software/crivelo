---
slug: coa-save-recipes
status: planned
created: 2026-06-20
tracker: local      # set by /breakdown-feature — linear | local
linear_project_id:  # linear mode only
linear_parent_issue: # linear mode only
feature_branch: feature/coa-save-recipes
---

# Coa — Save Recipes + Brew Route

## Overview

Coa (the 4:6 coffee calculator in `apps/crivelo-web`) currently has no way to keep
a brew you liked. This feature adds a save system: every completed brew is silently
captured as a reusable **last brew**, and any brew can be promoted into an explicit,
named **saved recipe**. Both are re-loadable — either jumped straight back into the
timer ("Brew again") or loaded into the calculator to tweak first ("Edit").

Delivering this cleanly requires extracting the brewing flow out of the in-page view
toggle inside `CoaCalculator` and into its **own route** (`/[locale]/brew`) driven
entirely by the URL. That route extraction is part of this feature's scope.

`crivelo-web` is a pure client-side PWA — no database, no auth, no API routes. All
persistence is `localStorage`, matching the existing `coa-brew` session key.

## Scope (three connected parts)

1. **Brew route extraction** — move the running-brew view (`BrewTimer`) out of the
   `CoaCalculator` idle↔brew view toggle into its own route `/[locale]/brew`.
2. **Param + autostart via URL** — the brew route is a pure function of its query
   string (recipe params + an `autostart` flag).
3. **Save system** — implicit "last brew" (auto-captured) + explicit named "saved
   recipes" (with metadata), both re-loadable via "Brew again" and "Edit".

## Routes (all locale-prefixed)

| Route | Purpose | Reads from URL | Key actions |
|---|---|---|---|
| `/[locale]` | Idle calculator (home) | optional `dose, ratio, acidity, strength` to pre-fill (Edit lands here) | "Begin brew" → `/brew?…&autostart=1`; shows **Last brew card** + **Saved recipes →** |
| `/[locale]/brew` | Running brew flow (today's `BrewTimer`) | `dose, ratio, acidity, strength`, `autostart` (`1`/`0`) | on **done**: write last-brew + offer "Save recipe" |
| `/[locale]/recipes` | Saved recipes list | — | per item: **Brew again** → `/brew?…&autostart=0`, **Edit** → `/?…`, **Delete** |

### Autostart

- `autostart=1` (navigated from the calculator's "Begin brew") preserves current
  behavior: the pre-roll countdown starts on load.
- `autostart=0` (navigated from a "Brew again" action) lands on a new **"ready"**
  state showing a **Start** button; nothing runs until the user taps it. Re-brewing a
  saved recipe shouldn't auto-launch a countdown the moment the screen appears.

This adds one pre-countdown status to `BrewTimer`'s session machine:
`ready → countdown → running → paused → done`.

## Param flow

The URL is the single source of truth for the *active* recipe params.

- **Calculator → Brew:** `router.push('/[locale]/brew?dose=20&ratio=15&acidity=0&strength=3&autostart=1')`
- **Brew again → Brew:** same shape with `autostart=0`
- **Edit → Calculator:** `router.push('/[locale]?dose=20&ratio=15&acidity=0&strength=3')`; the
  calculator seeds `useRecipe` from the query on mount.

**Validation:** parse and clamp query params to the existing input ranges
(dose 8–60, ratio 12–18, acidity −1…1, strength 1–4). Missing or out-of-range values
fall back to the calculator defaults (dose 20, ratio 15, acidity 0, strength 3) rather
than erroring.

## Storage (localStorage, client-only)

A small typed module (`lib/recipes-store.ts`) wraps all reads/writes with safe JSON
parsing and SSR guards (`typeof window === 'undefined'`), so components never touch
`localStorage` directly.

- **`coa-last-brew`** — single slot, overwritten on every completed brew. Params only
  (no metadata):
  ```ts
  { params: { dose: number; ratio: number; acidity: number; strengthPours: number }; brewedAt: number }
  ```
- **`coa-recipes`** — array of explicitly saved, named recipes:
  ```ts
  {
    id: string;
    name: string;            // required
    bean?: string;           // optional plain text
    grindSize?: string;      // optional plain text
    rating?: number;         // optional, 1–5
    params: { dose: number; ratio: number; acidity: number; strengthPours: number };
    createdAt: number;
  }[]
  ```

Everything else (water, pour schedule, times) stays derived from `params` via
`computeRecipe()` — never stored, to avoid sync drift.

## Done-screen flow (brew "done")

1. **Always**, silently: write `coa-last-brew` with the brew's params (no prompt).
2. **Offer** "Save recipe" — opens a form (Dialog/Sheet from `@crivelo/ui`) with:
   - **name** — required; pre-filled with a sensible default (e.g. `"20g · 1:15"`).
   - **bean** — optional plain text.
   - **grind size** — optional plain text.
   - **rating** — optional ★ 1–5.

   Save → append to `coa-recipes`, show a success toast (Sonner). Skipping is fine —
   the last brew is already captured.

## Home screen additions

- **Last brew card** — shown only when `coa-last-brew` exists. Compact params summary
  (e.g. `20g · 1:15 · balanced`) with **Brew again** (`/brew?…&autostart=0`) and
  **Edit** (`/?…`).
- **Saved recipes →** — an entry point (header icon or link) to `/[locale]/recipes`.

## Saved recipes route (`/[locale]/recipes`)

- List of cards: name, bean, grind size, rating, params summary. Each card has
  **Brew again**, **Edit**, and **Delete** (with an `AlertDialog` confirm).
- **Empty state** when no recipes are saved.

## Session-reset behavior

Starting a brew from the calculator ("Begin brew") or from "Brew again" must **reset**
any stale `coa-brew` timer session — it must not resume a previous brew's timer.
Resume-on-refresh applies only within the same active brew (e.g. an accidental reload
mid-brew). This extends the existing "brew session reset on re-entry" fix.

## Styling / conventions

- Tailwind v4 utility-first with `@crivelo/tokens` + `app/crivelo-theme.css`; no inline
  `style` with `var(--…)`, no raw hex.
- Primitives from `@crivelo/ui` only (Dialog/Sheet, AlertDialog, Input, Label, Button,
  Sonner toast). No direct `radix-ui`/shadcn imports.
- `motion/react` for animation with `prefers-reduced-motion` respected.
- pt-BR only for user-facing UI strings; everything else English.

## Out of scope (v1)

- Accounts / cross-device sync.
- Editing a saved recipe's *params* in place (Edit routes through the calculator instead).
- Editing a saved recipe's metadata (name/bean/grind/rating) after creation.
- Capturing actual vs. planned brew time.
- Reordering, folders, tags, or search over saved recipes.
- Sharing beyond what query-param URLs already enable.

## Acceptance criteria

- [ ] Given the idle calculator, when I tap "Begin brew", then I navigate to `/[locale]/brew?…&autostart=1` and the pre-roll countdown starts on load (unchanged behavior).
- [ ] Given a brew reaches "done", when the done screen renders, then `coa-last-brew` has been written with that brew's params without any prompt.
- [ ] Given the done screen, when I tap "Save recipe", fill the name (and optionally bean, grind size, rating) and confirm, then a new entry appears in `coa-recipes` and a success toast shows.
- [ ] Given the done screen, when I dismiss the save offer without saving, then no entry is added to `coa-recipes` but `coa-last-brew` still reflects this brew.
- [ ] Given a saved last brew, when I open the home screen, then a "Last brew" card shows its params with "Brew again" and "Edit" actions.
- [ ] Given the last-brew card, when I tap "Brew again", then I land on `/[locale]/brew?…&autostart=0` in the "ready" state and no timer runs until I tap "Start".
- [ ] Given the last-brew card, when I tap "Edit", then the calculator loads with those params pre-filled from the URL query.
- [ ] Given saved recipes exist, when I open `/[locale]/recipes`, then each recipe shows its name, bean, grind size, rating, and params summary with "Brew again", "Edit", and "Delete".
- [ ] Given a saved recipe, when I tap "Brew again", then I land on `/[locale]/brew?…&autostart=0` in the "ready" state with that recipe's params.
- [ ] Given a saved recipe, when I tap "Edit", then the calculator loads pre-filled with that recipe's params.
- [ ] Given a saved recipe, when I tap "Delete" and confirm, then it is removed from `coa-recipes` and the list updates immediately.
- [ ] Given no saved recipes, when I open `/[locale]/recipes`, then an empty state is shown.
- [ ] Given a `/brew` URL with missing or out-of-range params, when it loads, then params clamp to valid ranges / fall back to defaults rather than erroring.
- [ ] Given a stale `coa-brew` session exists, when I start a brew with new params from the calculator or "Brew again", then the old session is reset and the timer reflects the new params.

## Tasks

- [ ] Storage module + URL param helpers
  - AC: A typed `lib/recipes-store.ts` wraps `coa-last-brew` (single slot) and `coa-recipes` (array) with SSR guards and safe JSON parsing; a param helper parses recipe params from a URL query and clamps/falls back out-of-range or missing values to the calculator defaults (dose 20, ratio 15, acidity 0, strength 3).
  - Test: 1. `npx tsc --noEmit` exits 0. 2. In devtools console, exercise the store helpers — adding a recipe round-trips through `coa-recipes`, delete removes it, and `coa-last-brew` read/write round-trips. 3. The param helper clamps `?dose=999` to 60 and returns defaults for a missing/garbage query.

- [ ] Brew route + URL params + autostart/ready state + session reset
  - AC: `BrewTimer` moves to its own route `/[locale]/brew` driven by the URL; "Begin brew" navigates to `/brew?…&autostart=1` and the pre-roll countdown starts on load (unchanged); `autostart=0` lands on a new "ready" state with a Start button and nothing runs until tapped; missing/out-of-range params clamp/fall back; starting a brew with new params resets any stale `coa-brew` session.
  - Test: 1. `npx tsc --noEmit` exits 0. 2. Visit `/[locale]/brew?dose=20&ratio=15&acidity=0&strength=3&autostart=1` → countdown starts on load. 3. Same URL with `autostart=0` → "ready" state, timer only runs after tapping Start. 4. `/brew?dose=999` → params clamp, no error. 5. After a stale session exists, starting a new brew with different params reflects the new params. 6. Playwright check on mobile + desktop breakpoints.

- [ ] Done-screen save flow (last-brew write + Save recipe form)
  - AC: Reaching "done" writes `coa-last-brew` with the brew's params without any prompt; a "Save recipe" form (`@crivelo/ui` Dialog/Sheet) with name (required, default-filled), bean (optional), grind size (optional), rating (optional ★ 1–5) appends to `coa-recipes` and shows a success toast; dismissing the offer adds nothing but `coa-last-brew` still reflects the brew.
  - Test: 1. `npx tsc --noEmit` exits 0. 2. Run a brew to done (dev speed debugger) → devtools shows `coa-last-brew` written. 3. Tap "Save recipe", fill name + optional fields, confirm → new `coa-recipes` entry + success toast. 4. Dismiss without saving → no `coa-recipes` entry, `coa-last-brew` still set. 5. Playwright check on mobile + desktop.

- [ ] Calculator URL pre-fill + home last-brew card + saved-recipes entry
  - AC: The calculator seeds `useRecipe` from `dose/ratio/acidity/strength` query params on mount (Edit lands here); the home screen shows a "Last brew" card (params summary, "Brew again" → `/brew?…&autostart=0`, "Edit" → `/?…`) only when `coa-last-brew` exists; a "Saved recipes →" entry point navigates to `/[locale]/recipes`.
  - Test: 1. `npx tsc --noEmit` exits 0. 2. Visit `/[locale]?dose=25&ratio=16&acidity=0.5&strength=2` → calculator inputs reflect those values. 3. With `coa-last-brew` seeded, home shows the card; "Brew again" → `/brew?…&autostart=0`, "Edit" → calculator pre-filled. 4. "Saved recipes →" navigates to `/[locale]/recipes`. 5. Playwright check on mobile + desktop.

- [ ] Saved recipes route
  - AC: `/[locale]/recipes` lists saved recipes as cards (name, bean, grind size, rating, params summary), each with "Brew again" (→ `/brew?…&autostart=0`), "Edit" (→ calculator pre-filled), and "Delete" (`AlertDialog` confirm) that removes it from `coa-recipes` and updates the list immediately; an empty state shows when none are saved.
  - Test: 1. `npx tsc --noEmit` exits 0. 2. Seed `coa-recipes` → `/[locale]/recipes` renders the cards with all fields. 3. "Brew again" → `/brew?…&autostart=0` with the recipe's params; "Edit" → calculator pre-filled. 4. "Delete" → confirm → recipe removed and list updates. 5. Clear all recipes → empty state shows. 6. Playwright check on mobile + desktop.
