/**
 * The content model, mirroring docs/03-content-schema.md.
 *
 * Two layers, deliberately separated:
 *
 *   Raw*    — exactly what Juliana types into one spreadsheet tab. Strings and
 *             numbers as authored, nothing computed. The importer's input.
 *   (plain) — the derived shape the app consumes from content/content.json,
 *             with every chemistry figure already computed at import time so the
 *             app never re-derives it from a formula at runtime.
 *
 * Keeping them apart is what lets the importer be the single place chemistry
 * enters the system, and the single place her sheet can be rejected.
 *
 * Enums are union types, not TS `enum`s: Node 24 runs these files directly by
 * stripping types, and `enum` is one of the few constructs stripping cannot
 * handle (it emits runtime code).
 */
import type { IonKey } from "./chemistry.ts";

export type { IonKey };

/** Ions a mineral can be dosed FOR. Counter-ions are along for the ride. */
export const TARGET_IONS = ["Ca", "Mg", "HCO3", "Na", "K"] as const;
export type TargetIon = (typeof TARGET_IONS)[number];

export const COUNTER_IONS = ["Cl", "SO4", "HCO3", "citrate", "none"] as const;
export type CounterIon = (typeof COUNTER_IONS)[number];

export const LEVELS = ["iniciante", "avançado"] as const;
export type Level = (typeof LEVELS)[number];

/** Ion concentrations in mg/L **of the ion** (never of the salt). */
export type IonProfile = Partial<Record<IonKey, number>>;

// ---------------------------------------------------------------------------
// Raw rows — one per spreadsheet tab, before validation and derivation
// ---------------------------------------------------------------------------

/** Tab `Sais`. */
export interface RawMineral {
  id: string;
  name_pt: string;
  /** Full hydrate form, e.g. `MgSO4·7H2O`. The importer parses it. */
  formula: string;
  ion: string;
  counter_ion: string;
  sensory_note: string;
  espresso_safe: boolean;
  buy_url?: string;
}

/** Tab `Concentrados`. */
export interface RawConcentrate {
  id: string;
  mineral_id: string;
  label_pt: string;
  /** Grams of salt weighed, as the hydrate named in the mineral's formula. */
  salt_g: number;
  /** Final volume in mL. */
  water_ml: number;
  shelf_life_days: number;
  storage_note: string;
  /** Newline-separated preparation steps. */
  steps_pt: string;
}

/** Tab `Receitas`. */
export interface RawRecipe {
  id: string;
  name_pt: string;
  promise_pt: string;
  methods: string[];
  target_Ca: number;
  target_Mg: number;
  target_HCO3: number;
  target_Na: number;
  target_K: number;
  /** Concentrates this recipe uses, in mixing order. */
  concentrate_ids: string[];
  espresso_safe: boolean;
  /** Optional override in [-1, 1]; blank means "use the formula". */
  plane_x?: number;
  plane_y?: number;
  level: string;
}

/** Tab `Substituições`. */
export interface RawEquivalence {
  from_mineral_id: string;
  to_mineral_id: string;
  shared_ion: string;
  note_pt: string;
  espresso_note_pt?: string;
}

/** Tab `Águas de partida`. */
export interface RawBaseWater {
  id: string;
  name_pt: string;
  Ca: number;
  Mg: number;
  HCO3: number;
  Na: number;
  K: number;
  source: string;
}

/** Tab `Aprender`. */
export interface RawLesson {
  id: string;
  order: number;
  title_pt: string;
  body_md: string;
}

/** Tab `Limites` — a flat key/value sheet. */
export type RawGuards = Record<string, number>;

// ---------------------------------------------------------------------------
// Derived content — what ships in content/content.json
// ---------------------------------------------------------------------------

export interface Mineral extends Omit<RawMineral, "ion" | "counter_ion"> {
  ion: TargetIon;
  counter_ion: CounterIon;
  /** g/mol of the salt AS WEIGHED, hydrate included. */
  molar_mass: number;
  /** mg of the target ion per mg of salt. Derived from `formula`, never typed. */
  ion_mass_fraction: number;
  counter_ion_mass_fraction: number;
  /** 2.497 Ca · 4.118 Mg · 0.820 HCO3 · 0 otherwise. */
  ion_as_caco3_factor: number;
  /**
   * Mass fraction of EVERY ion the salt carries, including spectators — dosing
   * KHCO3 for bicarbonate also adds potassium, and the ion sheet must say so.
   */
  ion_fractions: IonProfile;
}

export interface Concentrate extends RawConcentrate {
  /**
   * mg of the mineral's target ion per mL of concentrate:
   * `salt_g × ion_mass_fraction × 1000 / water_ml`.
   *
   * Drops are NOT precomputed — the drop volume is a per-device setting, so
   * mg-per-drop is a runtime multiplication (see dosing.ts).
   */
  ion_mg_per_ml: number;
  /** The ion this concentrate supplies, copied from its mineral for convenience. */
  ion: TargetIon;
}

export interface PlanePoint {
  x: number;
  y: number;
}

export interface Recipe extends Omit<RawRecipe, "level" | "plane_x" | "plane_y"> {
  level: Level;
  /** Targets as an ion profile, mg/L. Blank columns become 0, not undefined. */
  targets: IonProfile;
  /** Juliana's override when she supplied one; otherwise the formula's point. */
  plane: PlanePoint;
  /** True when `plane` came from her sheet rather than the formula. */
  plane_is_override: boolean;
  gh_caco3: number;
  kh_caco3: number;
  tds_estimate: number;
}

export interface Equivalence extends Omit<RawEquivalence, "shared_ion"> {
  shared_ion: TargetIon;
  /**
   * Salt-mass conversion factor between the two minerals for the shared ion.
   * Informational: at runtime drops of B are computed from B's own ion yield,
   * which already accounts for it. Kept because Juliana's sheet documents it.
   */
  factor: number;
}

export interface BaseWater extends RawBaseWater {
  /** The same values as an ion profile, for arithmetic against recipe targets. */
  ions: IonProfile;
}

export type Lesson = RawLesson;

/**
 * Thresholds from the `Limites` tab. Required keys are listed explicitly so a
 * missing one fails the import rather than defaulting silently — a silent
 * default here would mean a guard that never fires.
 */
export interface Guards {
  /** Warn when Ca × HCO3 (mg/L²) exceeds this. */
  precip_ca_hco3_product: number;
  /** Below this KH (as CaCO3) the water may taste sour. */
  kh_floor_caco3: number;
  /** Above this KH (as CaCO3) the water may taste flat. */
  kh_ceiling_caco3: number;
  /** Under this many drops, lead the row with mL. */
  drops_show_ml_below: number;
  /** Over this many drops, lead with mL and flag it. */
  drops_show_ml_above: number;
  /** Onboarding default for drops per mL. */
  default_drops_per_ml: number;
}

export const REQUIRED_GUARD_KEYS = [
  "precip_ca_hco3_product",
  "kh_floor_caco3",
  "kh_ceiling_caco3",
  "drops_show_ml_below",
  "drops_show_ml_above",
  "default_drops_per_ml",
] as const satisfies readonly (keyof Guards)[];

/** The whole payload the app loads once and caches for offline. */
export interface Content {
  version: string;
  generated_at: string;
  minerals: Mineral[];
  concentrates: Concentrate[];
  recipes: Recipe[];
  equivalences: Equivalence[];
  base_waters: BaseWater[];
  guards: Guards;
  lessons: Lesson[];
}
