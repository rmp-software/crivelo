/**
 * The dosing engine: targets in, drops out.
 *
 * One formula produces every number the app shows (docs/01 § Calculation rules):
 *
 *   gotas = (C_alvo − C_base) [mg/L] × V [L] / y [mg de íon por gota]
 *   y     = (m_sal [g] × f_íon × 1000 / V_conc [mL]) × v_gota [mL]
 *
 * `m_sal × f_íon × 1000 / V_conc` is precomputed at import time as a
 * concentrate's `ion_mg_per_ml`; `v_gota` stays a runtime value because the
 * dropper is a per-device setting.
 *
 * Pure: no DOM, no I/O, no dependencies. Every function here is total — given
 * content that passed the importer's validations it cannot throw.
 *
 * WARNINGS ARE CODES, NOT COPY. The engine emits a `code` plus the numbers that
 * triggered it; the UI renders Juliana's Portuguese. Phase 3 of the build order
 * has her reviewing every string, so baking her wording in here would put copy
 * in the one module that has no business holding it.
 */
import { ionAsCaCO3Factor, type IonKey } from "./chemistry.ts";
import type {
  BaseWater,
  Concentrate,
  Guards,
  IonProfile,
  Mineral,
  PlanePoint,
  Recipe,
  TargetIon,
} from "./types.ts";
import { TARGET_IONS } from "./types.ts";

/**
 * A guard that tripped: the code, plus exactly the numbers that tripped it.
 *
 * A DISCRIMINATED UNION on `code`, not a code beside an untyped bag. The copy
 * layer (`app/receitas/[recipeId]/warnings.ts`) reads these fields by name to
 * build a sentence, and a `Record<string, string | number>` context made that a
 * string match no compiler checked: renaming `ceiling` below would have
 * type-checked clean and shipped `Number(undefined)` → `Intl…format(NaN)` →
 * the literal "NaN" into a student's dose row. Keyed by `code`, the same rename
 * is a compile error at the consumer, which is where it has to be — a test with
 * a hardcoded expected string is a net, not a guarantee.
 *
 * Each variant carries the fields `computeRecipe` actually pushes, at their real
 * types. Widening one to `string | number` to make a builder fit would put the
 * hole straight back.
 */
export type Warning =
  /** The starting water already meets or exceeds this ion's target. */
  | {
      code: "base_water_covers";
      context: {
        /** What makes a row-scoped warning addressable to one dose row. */
        concentrate_id: string;
        ion: TargetIon;
        target: number;
        base: number;
        base_water: string;
      };
    }
  /** More drops than is reasonable to count; suggest a stronger stock. */
  | {
      code: "high_drop_count";
      context: {
        concentrate_id: string;
        drops: number;
        ml: number;
        ceiling: number;
      };
    }
  /** Ca × HCO3 is above Juliana's threshold; the jug may precipitate chalk. */
  | {
      code: "precipitation_risk";
      context: { product: number; threshold: number; Ca: number; HCO3: number };
    }
  /** KH below her floor — "pode ficar ácida". */
  | { code: "kh_below_floor"; context: { kh: number; floor: number } }
  /** KH above her ceiling — "pode ficar chata". */
  | { code: "kh_above_ceiling"; context: { kh: number; ceiling: number } };

export type WarningCode = Warning["code"];

/** The context of one code, for a consumer that handles codes one at a time. */
export type WarningContext<C extends WarningCode> = Extract<
  Warning,
  { code: C }
>["context"];

/** Which number leads the row. Under 3 drops or over 60, mL is the honest unit. */
export type RowDisplay = "drops" | "ml";

export interface DoseRow {
  concentrate_id: string;
  mineral_id: string;
  label_pt: string;
  ion: TargetIon;
  /** mg/L of the ion this row must add, after base-water subtraction. */
  delta_mg_per_l: number;
  /** Exact millilitres for the whole batch — what a syringe user needs. */
  ml: number;
  /** Whole drops, rounded. What the row leads with in the normal case. */
  drops: number;
  display: RowDisplay;
  /** The starting water already covers this target, so the row doses nothing. */
  covered_by_base: boolean;
  /** Over the guard ceiling — show mL first and suggest a stronger stock. */
  high_drop_count: boolean;
  /** Set when this row replaced another mineral via an equivalence rule. */
  substituted_for_mineral_id?: string;
}

export interface SubstitutionInfo {
  from_mineral_id: string;
  to_mineral_id: string;
  note_pt: string;
  espresso_note_pt?: string;
}

export interface ComputeRecipeInput {
  /**
   * PRECONDITION: `recipe.concentrate_ids` carries at most ONE concentrate per
   * target ion, with no duplicates. Each row's dose is derived independently
   * from `targets[ion]`, so two rows supplying the same ion would each dose the
   * FULL target — double the mineral in the jug, while the GH/KH summary
   * (computed from targets, not from rows) still reads correct and hides it.
   *
   * The importer rejects both shapes. A future custom-recipe builder (S6) must
   * enforce the same rule before calling this.
   */
  recipe: Recipe;
  baseWater: BaseWater;
  /** Any superset of the concentrates the recipe references. */
  concentrates: Concentrate[];
  minerals: Mineral[];
  guards: Guards;
  drops_per_ml: number;
  volume_l: number;
}

export interface RecipeResult {
  recipe_id: string;
  volume_l: number;
  drops_per_ml: number;
  rows: DoseRow[];
  /** mg/L of every ion in the finished water, spectators included. */
  ions: IonProfile;
  gh_caco3: number;
  kh_caco3: number;
  /** Sum of dissolved ions in mg/L. An estimate — never compare it to a meter. */
  tds_estimate: number;
  plane: PlanePoint;
  plane_is_override: boolean;
  /** Juliana's flag AND no chloride in the glass. */
  espresso_safe: boolean;
  warnings: Warning[];
  substitution?: SubstitutionInfo;
  /** Retained so applySubstitution can re-run the same calculation. */
  input: ComputeRecipeInput;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to the nearest whole drop, with exact halves going up.
 *
 * `Math.round` alone is not enough here: the drop count is the end of a chain
 * of divisions (grams → mass fraction → mg/mL → mL → drops), so a value that is
 * mathematically 12.5 routinely arrives as 12.499999999999998 and rounds DOWN.
 * A student dosing 0,5 mL with a 25-drop dropper would get 12 drops on one
 * recipe and 13 on an algebraically identical one. Normalising to 12 significant
 * digits first discards the float dust without touching any genuine value — no
 * real drop count is decided at the 13th digit.
 */
function roundDrops(exact: number): number {
  return Math.round(Number(exact.toPrecision(12)));
}

/** GH and KH as ppm CaCO3 from an ion profile. */
export function hardnessAsCaCO3(ions: IonProfile): { gh: number; kh: number } {
  const gh =
    (ions.Ca ?? 0) * ionAsCaCO3Factor("Ca") + (ions.Mg ?? 0) * ionAsCaCO3Factor("Mg");
  const kh = (ions.HCO3 ?? 0) * ionAsCaCO3Factor("HCO3");
  return { gh, kh };
}

/** Sum of dissolved ions, mg/L. Presented as an estimate, never as a meter reading. */
export function tdsEstimate(ions: IonProfile): number {
  return Object.values(ions).reduce((sum, value) => sum + (value ?? 0), 0);
}

/**
 * Where this water sits on the sensory plane (docs/01 § Calculation rules):
 *
 *   x = (0.5 − KH/GH) / 0.35 − Na/80 + 0.3 (Ca share − 0.5)   doce ↔ brilhante
 *   y = (GH − 80) / 80                                        leve ↔ forte
 *
 * Both clamped to ±1. Juliana's per-recipe override wins over this whenever she
 * supplied one — the model is a proposal for her to tune, not a measurement.
 */
export function planeFor(ions: IonProfile): PlanePoint {
  const { gh, kh } = hardnessAsCaCO3(ions);
  const na = ions.Na ?? 0;

  // With no hardness at all the ratio KH/GH is undefined. Pure water sits at the
  // origin's soft end; buffer with no hardness is as far "doce" as the axis goes.
  if (gh <= 0) {
    return { x: kh > 0 ? -1 : 0, y: -1 };
  }

  const caShare = ((ions.Ca ?? 0) * ionAsCaCO3Factor("Ca")) / gh;
  const x = (0.5 - kh / gh) / 0.35 - na / 80 + 0.3 * (caShare - 0.5);
  const y = (gh - 80) / 80;

  return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
}

/**
 * Compute a recipe into drops.
 *
 * Deviates from the kickoff's positional sketch
 * (`computeRecipe(recipe, baseWater, concentrates, drops_per_ml, volume_l)`) by
 * taking one options object: the calculation also needs the minerals (for
 * spectator ions and the chloride check) and the guards, and seven positional
 * arguments is a bug waiting to happen.
 */
export function computeRecipe(input: ComputeRecipeInput): RecipeResult {
  const { recipe, baseWater, concentrates, minerals, guards, drops_per_ml, volume_l } =
    input;

  const concentrateById = new Map(concentrates.map((c) => [c.id, c]));
  const mineralById = new Map(minerals.map((m) => [m.id, m]));

  const rows: DoseRow[] = [];
  const warnings: Warning[] = [];

  // --- Rows, in Juliana's mixing order (bicarbonate last lives in the data) ---
  for (const concentrateId of recipe.concentrate_ids) {
    const concentrate = concentrateById.get(concentrateId);
    if (!concentrate) continue; // the importer rejects dangling refs
    const mineral = mineralById.get(concentrate.mineral_id);
    if (!mineral) continue;

    const ion = concentrate.ion;
    const target = recipe.targets[ion] ?? 0;
    const base = baseWater.ions[ion] ?? 0;

    // Base-water subtraction, clamped at zero: a starting water richer than the
    // target cannot be un-mineralised, so the row doses nothing and says why.
    const shortfall = target - base;
    const coveredByBase = target > 0 && shortfall <= 0;
    const delta = Math.max(0, shortfall);

    const ml =
      concentrate.ion_mg_per_ml > 0 ? (delta * volume_l) / concentrate.ion_mg_per_ml : 0;
    const drops = roundDrops(ml * drops_per_ml);

    const highDropCount = drops > guards.drops_show_ml_above;
    const display: RowDisplay =
      drops < guards.drops_show_ml_below || highDropCount ? "ml" : "drops";

    rows.push({
      concentrate_id: concentrate.id,
      mineral_id: mineral.id,
      label_pt: concentrate.label_pt,
      ion,
      delta_mg_per_l: delta,
      ml,
      drops,
      display,
      covered_by_base: coveredByBase,
      high_drop_count: highDropCount,
    });

    if (coveredByBase) {
      warnings.push({
        code: "base_water_covers",
        // `concentrate_id` is what makes a row-scoped warning addressable. The
        // UI renders these on the row they describe, and it finds the row the
        // same way for every row-scoped code (`high_drop_count`, just below).
        context: {
          concentrate_id: concentrate.id,
          ion,
          target,
          base,
          base_water: baseWater.name_pt,
        },
      });
    }
    if (highDropCount) {
      warnings.push({
        code: "high_drop_count",
        context: { concentrate_id: concentrate.id, drops, ml, ceiling: guards.drops_show_ml_above },
      });
    }
  }

  // --- Ion totals in the finished water ---
  //
  // Targeted ions report the INTENDED concentration — max(target, base), not the
  // rounding-jittered delivered amount. That keeps the GH/KH line identical on a
  // recipe card and on the dosing screen regardless of volume or dropper, which
  // is what makes "GH 124 · KH 25" a stable property of the recipe. Where the
  // base water already exceeds the target, the real (higher) value is reported.
  const ions: IonProfile = {};
  for (const ion of TARGET_IONS) {
    const value = Math.max(recipe.targets[ion] ?? 0, baseWater.ions[ion] ?? 0);
    if (value > 0) ions[ion] = value;
  }

  // Spectator ions ride along with every salt: dosing KHCO3 for its bicarbonate
  // also adds potassium, and CaCl2 adds chloride. These never appear in a target
  // but they move the TDS estimate, the plane's sodium term and the ion sheet.
  for (const row of rows) {
    const mineral = mineralById.get(row.mineral_id);
    if (!mineral || mineral.ion_mass_fraction <= 0) continue;

    const saltMgPerL = row.delta_mg_per_l / mineral.ion_mass_fraction;
    for (const [key, fraction] of Object.entries(mineral.ion_fractions)) {
      const spectator = key as IonKey;
      if (spectator === row.ion) continue; // already counted as the target
      ions[spectator] = (ions[spectator] ?? 0) + saltMgPerL * (fraction ?? 0);
    }
  }

  const { gh, kh } = hardnessAsCaCO3(ions);

  // --- Guards ---
  const caHco3Product = (ions.Ca ?? 0) * (ions.HCO3 ?? 0);
  if (caHco3Product > guards.precip_ca_hco3_product) {
    warnings.push({
      code: "precipitation_risk",
      context: {
        product: caHco3Product,
        threshold: guards.precip_ca_hco3_product,
        Ca: ions.Ca ?? 0,
        HCO3: ions.HCO3 ?? 0,
      },
    });
  }
  if (kh < guards.kh_floor_caco3) {
    warnings.push({ code: "kh_below_floor", context: { kh, floor: guards.kh_floor_caco3 } });
  }
  if (kh > guards.kh_ceiling_caco3) {
    warnings.push({
      code: "kh_above_ceiling",
      context: { kh, ceiling: guards.kh_ceiling_caco3 },
    });
  }

  // Juliana's flag is necessary but not sufficient: a chloride-bearing salt in
  // the glass loses the badge regardless, because that is the one that eats a
  // boiler. Applies after substitution too, which is the point of recomputing.
  const usesChloride = rows.some(
    (row) => mineralById.get(row.mineral_id)?.counter_ion === "Cl"
  );
  const espressoSafe = recipe.espresso_safe && !usesChloride;

  return {
    recipe_id: recipe.id,
    volume_l,
    drops_per_ml,
    rows,
    ions,
    gh_caco3: gh,
    kh_caco3: kh,
    tds_estimate: tdsEstimate(ions),
    plane: recipe.plane_is_override ? recipe.plane : planeFor(ions),
    plane_is_override: recipe.plane_is_override,
    espresso_safe: espressoSafe,
    warnings,
    input,
  };
}

export interface EquivalenceRule {
  from_mineral_id: string;
  to_mineral_id: string;
  note_pt: string;
  espresso_note_pt?: string;
}

/**
 * Swap one mineral for an equivalent the student actually owns, and recompute.
 *
 * The drop count for the substitute is NOT scaled from the original's — it is
 * derived from the substitute's own ion yield, which already accounts for the
 * difference in mass fraction. (Both stocks at 30.000 ppm of HCO3 therefore
 * dose the same number of drops, while the counter-ions and the TDS estimate
 * change, which is exactly what the student needs told.)
 *
 * Returns the result unchanged when the rule does not apply to this recipe or
 * the student owns no concentrate of the substitute mineral — "never block a
 * brew" means a failed substitution is a no-op, never an error.
 */
export function applySubstitution(
  result: RecipeResult,
  equivalence: EquivalenceRule,
  inventory: Concentrate[]
): RecipeResult {
  const { input } = result;

  const replacedRow = result.rows.find(
    (row) => row.mineral_id === equivalence.from_mineral_id
  );
  if (!replacedRow) return result;

  const substitute = inventory.find(
    (concentrate) => concentrate.mineral_id === equivalence.to_mineral_id
  );
  if (!substitute) return result;

  // Keep the mixing order: the substitute takes the original's slot.
  const concentrateIds = input.recipe.concentrate_ids.map((id) =>
    id === replacedRow.concentrate_id ? substitute.id : id
  );

  // The substitute may not be in the original concentrate list (the student
  // owns it; the recipe never mentioned it), so make sure it is resolvable.
  const concentrates = input.concentrates.some((c) => c.id === substitute.id)
    ? input.concentrates
    : [...input.concentrates, substitute];

  const recomputed = computeRecipe({
    ...input,
    recipe: { ...input.recipe, concentrate_ids: concentrateIds },
    concentrates,
  });

  return {
    ...recomputed,
    rows: recomputed.rows.map((row) =>
      row.concentrate_id === substitute.id
        ? { ...row, substituted_for_mineral_id: equivalence.from_mineral_id }
        : row
    ),
    substitution: {
      from_mineral_id: equivalence.from_mineral_id,
      to_mineral_id: equivalence.to_mineral_id,
      note_pt: equivalence.note_pt,
      espresso_note_pt: equivalence.espresso_note_pt,
    },
  };
}
