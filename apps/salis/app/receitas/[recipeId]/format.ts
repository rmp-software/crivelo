/**
 * Pure pt-BR shaping, plus the water stepper's arithmetic, for S2 · Receita.
 *
 * Kept out of the component so the node test environment can assert it without
 * a renderer (`vitest.config.ts` is node-only — see its header).
 *
 * NOTHING here computes chemistry. Every quantity on S2 comes out of
 * `computeRecipe` (`engine/dosing.ts`); this module only decides how it is
 * printed and how far one press of − / + moves the jug.
 */

/**
 * The stepper's range and granularity (RMP-254): 100 mL to 5 L in 100 mL steps.
 * A jug on a counter, not a burette — 100 mL is the smallest batch worth dosing
 * (its rows already fall under the 3-drop rule) and 5 L is a day's brewing.
 */
export const WATER_MIN_ML = 100;
export const WATER_MAX_ML = 5000;
export const WATER_STEP_ML = 100;

/** The quick chips, from the S2 wireframe (`docs/01-v1-plan.md` § Screens). */
export const WATER_PRESETS_ML = [500, 1000, 2000];

/**
 * Hold a volume inside the stepper's range.
 *
 * The device store already guarantees a finite positive number (its
 * `positiveOr` gate), so this enforces the *range* only — a value stored by an
 * older build, or a hand-edited one, lands back inside the stepper instead of
 * driving a drop count the student can never step away from.
 */
export function clampWaterMl(ml: number): number {
  return Math.min(WATER_MAX_ML, Math.max(WATER_MIN_ML, Math.round(ml)));
}

/**
 * One press of − or +.
 *
 * Snaps onto the 100 mL grid on the way, so a volume that arrived from
 * somewhere else (an odd stored value, a future preset) steps to a round number
 * instead of carrying its remainder forever. Flooring up and ceiling down is
 * what guarantees the press always *moves*: at 1.050 mL, + gives 1.100 and −
 * gives 1.000.
 */
export function stepWaterMl(ml: number, direction: 1 | -1): number {
  const onGrid =
    direction > 0
      ? Math.floor(ml / WATER_STEP_ML) * WATER_STEP_ML
      : Math.ceil(ml / WATER_STEP_ML) * WATER_STEP_ML;
  return clampWaterMl(onGrid + direction * WATER_STEP_ML);
}

/** pt-BR whole number: `1000` → `1.000`. Drops and millilitres of water. */
const wholeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function formatWhole(value: number): string {
  return wholeFormat.format(value);
}

const fineMlFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const coarseMlFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A syringe amount, as the number alone — the unit is its own quieter span on
 * screen, so it is not baked in here.
 *
 * Two decimals below 10 mL, one at or above it. A drop is 0,05 mL, so the
 * hundredth is the smallest digit that means anything at all; past 10 mL (200
 * drops) it is noise, and nobody owns a syringe that resolves it.
 */
export function formatMl(ml: number): string {
  return ml < 10 ? fineMlFormat.format(ml) : coarseMlFormat.format(ml);
}

/** Portuguese agrees the noun with the count: 1 gota, 2 gotas. */
export function dropsUnit(drops: number): string {
  return drops === 1 ? "gota" : "gotas";
}

const ionFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** An ion concentration for the *ver íons* sheet, in mg/L. */
export function formatMgPerL(mgPerL: number): string {
  return ionFormat.format(mgPerL);
}

/**
 * Which ONE note a dose row shows under its numbers.
 *
 * A dose row's note band is held open on every row, at one line, in every state
 * — see `recipe-counter.tsx` § RowNote for why reserving it is forced. The
 * reservation only holds if the band's line count never depends on device state,
 * so the row shows exactly one note and this function is where that "exactly
 * one" lives: a boolean picked here cannot become a second band on screen.
 *
 * The order is the student's order, not the engine's:
 *  - `missing` first — it is the only interactive note and the only one that
 *    leads anywhere, and nothing else about a bottle they do not have is
 *    actionable.
 *  - `covered-by-base` next: the dose is zero, so a measuring hint about it
 *    would be about nothing. (Unreachable while the base water is distilled —
 *    see BASE_WATER — and live again the day RMP-261 lets a student pick one.)
 *  - `expired` over `high-drop-count`, because the shelf-life ⚠ has no other
 *    carrier on the row, while a high drop count already flipped the row's hero
 *    number to millilitres with the drops printed under it: the band is that
 *    rule's explanation, not its data.
 *  - the prep date last — the quiet case, and the only one that is not a
 *    warning.
 *
 * Flags rather than a `DoseRow`, so this module stays free of the engine and
 * testable in the node environment (see the header).
 */
export type RowNoteKind =
  | "missing"
  | "covered-by-base"
  | "expired"
  | "high-drop-count"
  | "prepared-on"
  | "none";

export function rowNoteKind(flags: {
  missing: boolean;
  coveredByBase: boolean;
  expired: boolean;
  highDropCount: boolean;
  hasPrepDate: boolean;
}): RowNoteKind {
  if (flags.missing) return "missing";
  if (flags.coveredByBase) return "covered-by-base";
  if (flags.expired) return "expired";
  if (flags.highDropCount) return "high-drop-count";
  return flags.hasPrepDate ? "prepared-on" : "none";
}

/**
 * Split a sentence into alternating literal / quantity segments.
 *
 * Even indices are literal text, odd indices are the quantities — the capture
 * group in `split` is what interleaves them, and `quantities.tsx` sets the odd
 * ones in mono. Here rather than in the component so the node test environment
 * can assert it without a renderer (see the header).
 *
 * `(?<!\p{L})` is load-bearing: without it a digit sitting inside a word gets
 * peeled into its own span mid-word — `"HCO3 já presente."` splits as
 * `["HCO", "3", " já presente."]` and renders `HCO` beside a mono `3`. Nothing
 * stops a chemical formula reaching this function; today's sentences only avoid
 * it because `warnings.ts` spells every ion out in Portuguese, which is a
 * convention in another file, not a guarantee. `\w` would not do — it excludes
 * `á`, `ç` and every other accented letter Portuguese actually uses.
 *
 * `[.,]` must be followed by a digit, which keeps a terminal period
 * (`…de 60.`) and a pt-BR thousands/decimal mark apart correctly: `1.000,5` is
 * one quantity, `60.` is a quantity and a full stop.
 */
const QUANTITY = /((?<!\p{L})\d+(?:[.,]\d+)*)/u;

export function splitQuantities(text: string): string[] {
  return text.split(QUANTITY);
}
