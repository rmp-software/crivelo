/**
 * Coa — the 4:6 method engine (Tetsu Kasuya, 2016 WBrC).
 *
 * Splits total water 40% flavor / 60% strength.
 *  - First 40%: two pours. Their split sets acidity <-> sweetness.
 *      smaller first pour = sweeter
 *      larger  first pour = brighter / more acidic
 *  - Latter 60%: N equal pours. More pours = stronger; fewer = lighter.
 * Pours are spaced 45s; a short drawdown closes the brew.
 *
 * Framework-agnostic, pure, dependency-free. Ported faithfully from the
 * prototype `coa-engine.js` so the calculator and the brew timer share the
 * exact same math.
 */

/** Seconds between pour starts. */
export const POUR_GAP = 45;
/** Seconds from the last pour to removing the dripper (final drawdown). */
export const DRAWDOWN = 30;
/**
 * Water flow rate — grams of water poured per second. The pour-step window is
 * derived as `pourGrams / POUR_FLOW_RATE`, so a 60 g pour takes 15 s (the 4:6
 * method's ~4 g/s ceiling). Presentation-only: it shapes how the brew timer
 * splits each pour into a "pour" then a "draw" phase (see {@link buildPhases})
 * and does NOT affect {@link computeRecipe}, `removeAt`, or the 45 s
 * {@link POUR_GAP} spacing.
 */
export const POUR_FLOW_RATE = 4;

/** Water-temperature guidance by roast (°C). */
export const TEMP = {
  light: 93,
  medium: 88,
  dark: 83,
  standard: 92,
} as const;

/** Brew phase a pour belongs to. */
export type Phase = 'flavor' | 'strength';

/** Inputs to {@link computeRecipe}. */
export interface RecipeInput {
  /** Dose of coffee in grams. */
  dose: number;
  /** Brew ratio (water per gram of coffee), e.g. 15 for 1:15. */
  ratio: number;
  /**
   * Taste axis: -1 (sweet) .. 0 (balanced) .. +1 (acidic/bright).
   * Clamped to [-1, 1]. Defaults to 0.
   */
  acidity?: number;
  /**
   * Count of latter-60% pours (1..4); 3 is the standard. Rounded and
   * clamped to [1, 4]. Defaults to 3.
   */
  strengthPours?: number;
}

/** A single pour in the schedule. */
export interface Step {
  /** Zero-based pour index. */
  index: number;
  /** Pour start time in seconds. */
  t: number;
  /** Pour start time formatted as m:ss. */
  time: string;
  /** Grams to add in this pour (exact). */
  pour: number;
  /** Grams to add in this pour, rounded to a whole number. */
  pourG: number;
  /** Cumulative grams after this pour (exact). */
  cumulative: number;
  /** Cumulative grams after this pour, rounded to a whole number. */
  cumulativeG: number;
  /** Human label, e.g. "First pour" or "Strength 1". */
  label: string;
  /** Brew phase this pour belongs to. */
  phase: Phase;
  /** Cumulative fraction of total water after this pour (0..1). */
  fraction: number;
}

/** Result of {@link computeRecipe}. */
export interface Recipe {
  /** Echoed dose (grams). */
  dose: number;
  /** Echoed ratio. */
  ratio: number;
  /** Total water (grams) = dose × ratio. */
  water: number;
  /** Total water rounded to a whole number. */
  waterG: number;
  /** Flavor-phase water (first 40%). */
  flavor: number;
  /** Strength-phase water (last 60%). */
  strength: number;
  /** Total number of pours (2 flavor + strengthPours). */
  nPours: number;
  /** Clamped/rounded count of strength pours (1..4). */
  strengthPours: number;
  /** Clamped acidity used (-1..1). */
  acidity: number;
  /** The full pour schedule. */
  steps: Step[];
  /** Time to remove the dripper, in seconds. */
  removeAt: number;
  /** Time to remove the dripper, formatted as m:ss. */
  removeTime: string;
  /** Total brew time, formatted as m:ss (same as removeTime). */
  totalTime: string;
}

/** Clamp `v` into the inclusive range [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Return `v` when it is a finite number, otherwise `fallback`. Guards the
 * engine against NaN/±Infinity inputs so a single bad value cannot poison the
 * whole recipe (a non-finite input silently propagates through every
 * pour/cumulative/removeAt).
 */
export function finiteOr(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

/** Format seconds as m:ss (e.g. 210 -> "3:30"). */
export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

/** Round grams to a whole number. */
export function fmtG(g: number): number {
  return Math.round(g);
}

/**
 * Compute the full 4:6 recipe and pour schedule.
 *
 * water = dose × ratio. The first 40% (flavor) is split into two pours where
 * f1 = flavor × (0.5 + 0.25·acidity) (so 25%..75% of the flavor water across
 * the acidity range). The last 60% (strength) is divided into N equal pours.
 * Pours start every {@link POUR_GAP} seconds; the dripper is removed
 * {@link DRAWDOWN} seconds after the last pour.
 */
export function computeRecipe(opts: RecipeInput): Recipe {
  // Coerce non-finite inputs (NaN/±Infinity) to their defaults before any math
  // so a bad value can't poison the recipe; valid inputs are untouched.
  const dose = finiteOr(opts.dose, 20);
  const ratio = finiteOr(opts.ratio, 15);
  // Clamp first so ±Infinity saturates to the range bound; finiteOr then maps
  // the remaining non-finite case (NaN, which clamp leaves as NaN) to default.
  const acidity = finiteOr(clamp(opts.acidity ?? 0, -1, 1), 0);
  const N = finiteOr(clamp(Math.round(opts.strengthPours ?? 3), 1, 4), 3);

  const water = dose * ratio;
  const flavor = water * 0.4;
  const strength = water * 0.6;

  // First pour grows toward acidity, shrinks toward sweetness (25%..75% of flavor).
  const f1 = flavor * (0.5 + 0.25 * acidity);
  const f2 = flavor - f1;
  const sPour = strength / N;

  const amounts: number[] = [f1, f2];
  for (let i = 0; i < N; i++) amounts.push(sPour);

  const labels: string[] = ['First pour', 'Second pour'];
  for (let i = 0; i < N; i++) {
    labels.push(N === 1 ? 'Strength pour' : 'Strength ' + (i + 1));
  }

  const phase: Phase[] = ['flavor', 'flavor'];
  for (let i = 0; i < N; i++) phase.push('strength');

  let cum = 0;
  const steps: Step[] = amounts.map((amt, i) => {
    cum += amt;
    return {
      index: i,
      t: i * POUR_GAP,
      time: fmtTime(i * POUR_GAP),
      pour: amt,
      pourG: fmtG(amt),
      cumulative: cum,
      cumulativeG: fmtG(cum),
      label: labels[i],
      phase: phase[i],
      fraction: cum / water,
    };
  });

  const removeAt = (amounts.length - 1) * POUR_GAP + DRAWDOWN;

  return {
    dose,
    ratio,
    water,
    waterG: fmtG(water),
    flavor,
    strength,
    nPours: amounts.length,
    strengthPours: N,
    acidity,
    steps,
    removeAt,
    removeTime: fmtTime(removeAt),
    totalTime: fmtTime(removeAt),
  };
}

/** Taste descriptor from an acidity value (-1..1). */
export function tasteLabel(a: number): string {
  if (a <= -0.66) return 'Sweet, round';
  if (a < -0.15) return 'Sweet-leaning';
  if (a <= 0.15) return 'Balanced';
  if (a < 0.66) return 'Bright-leaning';
  return 'Bright, juicy';
}

/**
 * Stable i18n key for the taste descriptor (matches `Taste.*` in the message
 * catalogs). The engine stays language-agnostic; UI resolves the key via
 * next-intl so the readout localizes. Keep in lockstep with {@link tasteLabel}.
 */
export type TasteKey =
  | 'sweetRound'
  | 'sweetLeaning'
  | 'balanced'
  | 'brightLeaning'
  | 'brightJuicy';

export function tasteKey(a: number): TasteKey {
  if (a <= -0.66) return 'sweetRound';
  if (a < -0.15) return 'sweetLeaning';
  if (a <= 0.15) return 'balanced';
  if (a < 0.66) return 'brightLeaning';
  return 'brightJuicy';
}

/** Strength descriptor from a pour count (1..4). */
export function strengthLabel(n: number): string {
  const map: Record<number, string> = {
    1: 'Light',
    2: 'Medium-light',
    3: 'Medium (standard)',
    4: 'Strong',
  };
  return map[n] || 'Medium';
}

/**
 * One phase of the running brew timer. Every pour in the schedule expands into
 * exactly two contiguous phases: a `'pour'` (add water up to `target`) followed
 * by a `'draw'` (let it draw down to the next pour, or the final removal).
 */
export interface TimerPhase {
  /** `'pour'` adds water; `'draw'` is the draw-down that follows it. */
  kind: 'pour' | 'draw';
  /** 1-based pour number this phase belongs to. */
  pourNo: number;
  /** Total number of pours in the schedule. */
  total: number;
  /** Phase start time in seconds (elapsed brew time). */
  start: number;
  /** Phase end time in seconds (elapsed brew time). */
  end: number;
  /** Cumulative target grams for this pour (the scale reading to hit). */
  target: number;
  /** Grams added during this pour. Set on `'pour'` phases; omitted for `'draw'`. */
  add?: number;
  /** Brew phase of the source pour. */
  phase: Phase;
  /** Start time (s) of the next pour, or `null` on the last pour. */
  nextPourStart: number | null;
  /** True when this phase belongs to the final pour. */
  isLastPour: boolean;
}

/**
 * Expand a {@link Recipe}'s pour schedule into the contiguous pour/draw phases
 * the brew timer renders. Each step `i` yields a `'pour'` phase
 * [`steps[i].t`, `pourEnd`] then a `'draw'` phase [`pourEnd`, `drawEnd`], where:
 *
 *   drawEnd = i is last ? recipe.removeAt : steps[i + 1].t
 *   pourEnd = min(steps[i].t + steps[i].pourG / POUR_FLOW_RATE, drawEnd)
 *
 * The pour window scales with the pour size at {@link POUR_FLOW_RATE} g/s, so a
 * 60 g pour occupies 15 s. The phases tile the whole brew with no gaps or
 * overlaps: the first phase starts at 0 and the last `'draw'` ends at
 * `recipe.removeAt`. Clamping `pourEnd` to `drawEnd` means a pour window never
 * overruns its draw-down (it collapses to zero length if the derived window
 * reaches past `drawEnd`). Pure.
 */
export function buildPhases(recipe: Recipe): TimerPhase[] {
  const steps = recipe.steps;
  const total = steps.length;
  const out: TimerPhase[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const isLastPour = i === total - 1;
    const drawEnd = isLastPour ? recipe.removeAt : steps[i + 1].t;
    const pourEnd = Math.min(s.t + s.pourG / POUR_FLOW_RATE, drawEnd);
    const nextPourStart = isLastPour ? null : steps[i + 1].t;
    out.push({
      kind: 'pour',
      pourNo: i + 1,
      total,
      start: s.t,
      end: pourEnd,
      target: s.cumulativeG,
      add: s.pourG,
      phase: s.phase,
      nextPourStart,
      isLastPour,
    });
    out.push({
      kind: 'draw',
      pourNo: i + 1,
      total,
      start: pourEnd,
      end: drawEnd,
      target: s.cumulativeG,
      phase: s.phase,
      nextPourStart,
      isLastPour,
    });
  }
  return out;
}
