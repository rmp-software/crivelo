import { describe, expect, it } from "vitest";
import { ionAsCaCO3Factor, ionFractions, ionMassFraction, molarMass } from "../chemistry.ts";
import {
  applySubstitution,
  computeRecipe,
  hardnessAsCaCO3,
  planeFor,
  type ComputeRecipeInput,
} from "../dosing.ts";
import type {
  BaseWater,
  Concentrate,
  CounterIon,
  Guards,
  IonProfile,
  Mineral,
  Recipe,
  TargetIon,
} from "../types.ts";

// ---------------------------------------------------------------------------
// Fixtures. Minerals derive every figure from their formula via chemistry.ts —
// the same path the importer uses — so a regression there fails here too.
// ---------------------------------------------------------------------------

function mineral(
  id: string,
  formula: string,
  ion: TargetIon,
  counter_ion: CounterIon,
  espresso_safe = true
): Mineral {
  return {
    id,
    name_pt: id,
    formula,
    ion,
    counter_ion,
    sensory_note: "",
    espresso_safe,
    molar_mass: molarMass(formula),
    ion_mass_fraction: ionMassFraction(formula, ion),
    counter_ion_mass_fraction:
      counter_ion === "none" ? 0 : ionMassFraction(formula, counter_ion),
    ion_as_caco3_factor: ionAsCaCO3Factor(ion),
    ion_fractions: ionFractions(formula),
  };
}

const MINERALS = {
  epsom: mineral("mgso4-7h2o", "MgSO4·7H2O", "Mg", "SO4"),
  calcium_chloride: mineral("cacl2-2h2o", "CaCl2·2H2O", "Ca", "Cl", false),
  gypsum: mineral("caso4-2h2o", "CaSO4·2H2O", "Ca", "SO4"),
  khco3: mineral("khco3", "KHCO3", "HCO3", "none"),
  nahco3: mineral("nahco3", "NaHCO3", "HCO3", "none"),
};

const ALL_MINERALS = Object.values(MINERALS);

/** Build a concentrate the way the importer does: grams of salt in a volume. */
function concentrate(
  id: string,
  m: Mineral,
  salt_g: number,
  water_ml: number
): Concentrate {
  return {
    id,
    mineral_id: m.id,
    label_pt: id,
    salt_g,
    water_ml,
    shelf_life_days: 90,
    storage_note: "",
    steps_pt: "",
    ion: m.ion,
    ion_mg_per_ml: (salt_g * m.ion_mass_fraction * 1000) / water_ml,
  };
}

/**
 * A concentrate expressed as "N ppm of the ion" — i.e. N mg of the ion per
 * litre of stock. This encodes the FIRST open question's optimistic reading
 * (see docs/01 § Open questions); the grams are back-computed from the formula
 * so the fixture stays honest about which salt it is.
 */
function concentrateAtIonPpm(id: string, m: Mineral, ionPpm: number): Concentrate {
  const water_ml = 1000;
  // ppm is mg of ion per LITRE of stock, so the target is ionPpm/1000 mg per mL.
  // Inverting ion_mg_per_ml = salt_g × f × 1000 / water_ml gives the 1e6.
  const salt_g = (ionPpm * water_ml) / (m.ion_mass_fraction * 1_000_000);
  return concentrate(id, m, salt_g, water_ml);
}

const GUARDS: Guards = {
  precip_ca_hco3_product: 2000,
  kh_floor_caco3: 20,
  kh_ceiling_caco3: 75,
  drops_show_ml_below: 3,
  drops_show_ml_above: 60,
  default_drops_per_ml: 20,
};

function baseWater(name: string, ions: IonProfile = {}): BaseWater {
  return {
    id: name,
    name_pt: name,
    Ca: ions.Ca ?? 0,
    Mg: ions.Mg ?? 0,
    HCO3: ions.HCO3 ?? 0,
    Na: ions.Na ?? 0,
    K: ions.K ?? 0,
    source: "",
    ions,
  };
}

const DISTILLED = baseWater("Destilada / RO");

function recipe(
  id: string,
  targets: IonProfile,
  concentrate_ids: string[],
  overrides: Partial<Recipe> = {}
): Recipe {
  return {
    id,
    name_pt: id,
    promise_pt: "",
    methods: [],
    target_Ca: targets.Ca ?? 0,
    target_Mg: targets.Mg ?? 0,
    target_HCO3: targets.HCO3 ?? 0,
    target_Na: targets.Na ?? 0,
    target_K: targets.K ?? 0,
    concentrate_ids,
    espresso_safe: false,
    level: "iniciante",
    targets,
    plane: { x: 0, y: 0 },
    plane_is_override: false,
    gh_caco3: 0,
    kh_caco3: 0,
    tds_estimate: 0,
    ...overrides,
  };
}

function input(partial: Partial<ComputeRecipeInput>): ComputeRecipeInput {
  return {
    recipe: recipe("r", {}, []),
    baseWater: DISTILLED,
    concentrates: [],
    minerals: ALL_MINERALS,
    guards: GUARDS,
    drops_per_ml: 20,
    volume_l: 1,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// The worked example from docs/01 § Calculation rules
// ---------------------------------------------------------------------------

describe("worked example from docs/01", () => {
  // 49,2 g KHCO3 in 1.000 mL, HCO3 fraction 0,61 → 30 mg HCO3 per mL and
  // 1,5 mg per 0,05 mL drop; a 30 mg/L target in 1 L is 20 gotas.
  const stock = concentrate("khco3-30k", MINERALS.khco3, 49.2, 1000);

  it("yields 30 mg of HCO3 per mL", () => {
    expect(stock.ion_mg_per_ml).toBeCloseTo(30, 1);
  });

  it("yields 1.5 mg of HCO3 per 0.05 mL drop", () => {
    expect(stock.ion_mg_per_ml * 0.05).toBeCloseTo(1.5, 2);
  });

  it("doses 20 gotas for 30 mg/L in 1 L at 20 gotas/mL", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("teste", { HCO3: 30 }, [stock.id]),
        concentrates: [stock],
      })
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].drops).toBe(20);
    expect(result.rows[0].ml).toBeCloseTo(1, 2);
  });

  it("needs 33 gotas if the same bottle is read as 30 g of SALT per litre", () => {
    // The other reading of open question 1: 30 g/L of salt is only 18,3 mg/mL
    // of bicarbonate, so the same recipe needs 1,64× the drops. This is the
    // 1.6× the plan warns about — the test exists to prove the engine tracks
    // the convention through `salt_g`, with no constant to edit either way.
    const saltReading = concentrate("khco3-30k-salt", MINERALS.khco3, 30, 1000);
    expect(saltReading.ion_mg_per_ml).toBeCloseTo(18.28, 2);

    const result = computeRecipe(
      input({
        recipe: recipe("teste", { HCO3: 30 }, [saltReading.id]),
        concentrates: [saltReading],
      })
    );
    expect(result.rows[0].drops).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// Published reference recipes — the Phase 1 gate
// ---------------------------------------------------------------------------

describe("Barista Hustle 1000-ppm concentrates (within 1%)", () => {
  // docs/02: 2,45 g Epsom/L for GH and 1,68 g NaHCO3/L for KH, each a
  // 1.000 ppm stock, so 1 mL of stock per litre = 1 ppm.
  it("2,45 g Epsom per litre is a 1000 ppm GH stock", () => {
    const stock = concentrate("bh-gh", MINERALS.epsom, 2.45, 1000);
    const { gh } = hardnessAsCaCO3({ Mg: stock.ion_mg_per_ml * 1000 });
    expect(gh).toBeGreaterThan(990);
    expect(gh).toBeLessThan(1010);
    expect(Math.abs(gh - 1000) / 1000).toBeLessThan(0.01);
  });

  it("1,68 g NaHCO3 per litre is a 1000 ppm KH stock", () => {
    const stock = concentrate("bh-kh", MINERALS.nahco3, 1.68, 1000);
    const { kh } = hardnessAsCaCO3({ HCO3: stock.ion_mg_per_ml * 1000 });
    expect(Math.abs(kh - 1000) / 1000).toBeLessThan(0.01);
  });

  it("one mL of each stock per litre gives 1 ppm", () => {
    const gh = concentrate("bh-gh", MINERALS.epsom, 2.45, 1000);
    const result = computeRecipe(
      input({
        recipe: recipe("bh", { Mg: gh.ion_mg_per_ml }, [gh.id]),
        concentrates: [gh],
      })
    );
    expect(result.rows[0].ml).toBeCloseTo(1, 6);
    expect(result.gh_caco3).toBeCloseTo(0.995, 2);
  });
});

describe("Rao/Perger (within 5%)", () => {
  // docs/02: 25 g Epsom + 8,6 g NaHCO3 in 500 mL, dosed 1:200 → GH ≈ 100, KH ≈ 50.
  // Modelled as two stocks because Salis keeps one mineral per bottle; the
  // arithmetic is identical and Ca never meets bicarbonate at stock strength.
  const mgStock = concentrate("rao-mg", MINERALS.epsom, 25, 500);
  const khStock = concentrate("rao-kh", MINERALS.nahco3, 8.6, 500);

  // 1:200 means 5 mL of each stock in a litre of finished water.
  const targets: IonProfile = {
    Mg: mgStock.ion_mg_per_ml * 5,
    HCO3: khStock.ion_mg_per_ml * 5,
  };

  const result = computeRecipe(
    input({
      recipe: recipe("rao", targets, [mgStock.id, khStock.id]),
      concentrates: [mgStock, khStock],
    })
  );

  it("doses 5 mL of each stock per litre (the 1:200 dilution)", () => {
    expect(result.rows[0].ml).toBeCloseTo(5, 6);
    expect(result.rows[1].ml).toBeCloseTo(5, 6);
  });

  it("lands on GH ≈ 100", () => {
    expect(Math.abs(result.gh_caco3 - 100) / 100).toBeLessThan(0.05);
  });

  it("lands on KH ≈ 50", () => {
    expect(Math.abs(result.kh_caco3 - 50) / 50).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// The plan's own "Mais doce" figures
// ---------------------------------------------------------------------------

describe('preset "Mais doce" from docs/01 § Screens', () => {
  // Ca 25 · Mg 15 · HCO3 30 mg/L → 17 · 10 · 20 gotas per litre, GH 124 · KH 25.
  // These figures assume 30.000 ppm OF THE ION and 20 gotas/mL — the first open
  // question. If Juliana answers "of the salt", this fixture's expected drop
  // counts change and the engine does not.
  const ca = concentrateAtIonPpm("ca-30k", MINERALS.calcium_chloride, 30_000);
  const mg = concentrateAtIonPpm("mg-30k", MINERALS.epsom, 30_000);
  const khco3 = concentrateAtIonPpm("khco3-30k", MINERALS.khco3, 30_000);

  const result = computeRecipe(
    input({
      recipe: recipe("mais-doce", { Ca: 25, Mg: 15, HCO3: 30 }, [mg.id, ca.id, khco3.id]),
      concentrates: [mg, ca, khco3],
    })
  );

  it("doses 10 · 17 · 20 gotas per litre", () => {
    expect(result.rows.map((row) => row.drops)).toEqual([10, 17, 20]);
  });

  it("reports GH 124 · KH 25", () => {
    expect(Math.round(result.gh_caco3)).toBe(124);
    expect(Math.round(result.kh_caco3)).toBe(25);
  });

  it("reports the potassium that rides along with the bicarbonate", () => {
    // 30 mg/L HCO3 from KHCO3 drags in ~19 mg/L of K. It is in no target, but
    // the ion sheet and the TDS estimate must account for it.
    expect(result.ions.K).toBeCloseTo(19.2, 1);
  });

  it("is not espresso-safe: the calcium source is a chloride", () => {
    expect(result.espresso_safe).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Base water
// ---------------------------------------------------------------------------

describe("base-water subtraction", () => {
  const mg = concentrateAtIonPpm("mg-30k", MINERALS.epsom, 30_000);

  it("doses only the shortfall", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id]),
        baseWater: baseWater("Crystal", { Mg: 5 }),
        concentrates: [mg],
      })
    );
    // 10 mg/L of shortfall instead of 15 → two thirds of the drops.
    expect(result.rows[0].delta_mg_per_l).toBe(10);
    expect(result.rows[0].drops).toBe(7);
  });

  it("clamps at zero and flags when the base water already covers the target", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id]),
        baseWater: baseWater("Dura", { Mg: 40 }),
        concentrates: [mg],
      })
    );

    expect(result.rows[0].delta_mg_per_l).toBe(0);
    expect(result.rows[0].drops).toBe(0);
    expect(result.rows[0].covered_by_base).toBe(true);
    expect(result.warnings.map((w) => w.code)).toContain("base_water_covers");
  });

  it("reports the real total, not the target, when the base exceeds it", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id]),
        baseWater: baseWater("Dura", { Mg: 40 }),
        concentrates: [mg],
      })
    );
    // The water genuinely holds 40 mg/L of Mg; the GH line must not claim 15.
    expect(result.ions.Mg).toBe(40);
    expect(result.gh_caco3).toBeCloseTo(40 * 4.118, 3);
  });
});

// ---------------------------------------------------------------------------
// Substitution
// ---------------------------------------------------------------------------

describe("substitution KHCO3 → NaHCO3", () => {
  const khco3 = concentrateAtIonPpm("khco3-30k", MINERALS.khco3, 30_000);
  const nahco3 = concentrateAtIonPpm("nahco3-30k", MINERALS.nahco3, 30_000);
  const mg = concentrateAtIonPpm("mg-30k", MINERALS.epsom, 30_000);

  const original = computeRecipe(
    input({
      recipe: recipe("r", { Mg: 15, HCO3: 30 }, [mg.id, khco3.id]),
      concentrates: [mg, khco3],
    })
  );

  const rule = {
    from_mineral_id: MINERALS.khco3.id,
    to_mineral_id: MINERALS.nahco3.id,
    note_pt: "Mais redondo, menos brilho; adiciona sódio.",
  };

  const swapped = applySubstitution(original, rule, [nahco3]);

  it("keeps the same drop count when both stocks carry 30.000 ppm of HCO3", () => {
    expect(original.rows[1].drops).toBe(20);
    expect(swapped.rows[1].drops).toBe(20);
  });

  it("keeps KH unchanged", () => {
    expect(swapped.kh_caco3).toBeCloseTo(original.kh_caco3, 6);
  });

  it("adds sodium and drops the potassium", () => {
    expect(original.ions.K).toBeCloseTo(19.2, 1);
    expect(original.ions.Na).toBeUndefined();

    expect(swapped.ions.Na).toBeCloseTo(11.3, 1);
    expect(swapped.ions.K).toBeUndefined();
  });

  it("moves the TDS estimate, because the counter-ion changed", () => {
    expect(swapped.tds_estimate).not.toBeCloseTo(original.tds_estimate, 1);
  });

  it("carries Juliana's note and marks the row", () => {
    expect(swapped.substitution?.note_pt).toBe(rule.note_pt);
    expect(swapped.rows[1].substituted_for_mineral_id).toBe(MINERALS.khco3.id);
  });

  it("is a no-op when the student owns no substitute — never block a brew", () => {
    expect(applySubstitution(original, rule, [])).toBe(original);
  });

  it("is a no-op when the rule does not apply to this recipe", () => {
    const unrelated = { ...rule, from_mineral_id: MINERALS.gypsum.id };
    expect(applySubstitution(original, unrelated, [nahco3])).toBe(original);
  });

  it("re-evaluates the espresso badge after the swap", () => {
    // CaCl2 → CaSO4 removes the chloride, so a recipe Juliana flagged safe
    // earns the badge only once the chloride is gone.
    const cacl2 = concentrateAtIonPpm("ca-30k", MINERALS.calcium_chloride, 30_000);
    const caso4 = concentrateAtIonPpm("caso4-30k", MINERALS.gypsum, 30_000);

    const withChloride = computeRecipe(
      input({
        recipe: recipe("r", { Ca: 25 }, [cacl2.id], { espresso_safe: true }),
        concentrates: [cacl2],
      })
    );
    expect(withChloride.espresso_safe).toBe(false);

    const withSulfate = applySubstitution(
      withChloride,
      {
        from_mineral_id: MINERALS.calcium_chloride.id,
        to_mineral_id: MINERALS.gypsum.id,
        note_pt: "Menos corpo, mais clareza.",
      },
      [caso4]
    );
    expect(withSulfate.espresso_safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rounding and display rules
// ---------------------------------------------------------------------------

describe("rounding rules", () => {
  const mg = concentrateAtIonPpm("mg-30k", MINERALS.epsom, 30_000);

  it("rounds to the nearest whole drop", () => {
    // 16,667 drops → 17, not 16.
    const result = computeRecipe(
      input({ recipe: recipe("r", { Mg: 25 }, [mg.id]), concentrates: [mg] })
    );
    expect(result.rows[0].ml).toBeCloseTo(0.8333, 4);
    expect(result.rows[0].drops).toBe(17);
  });

  it("leads with mL under 3 drops", () => {
    const result = computeRecipe(
      input({ recipe: recipe("r", { Mg: 3 }, [mg.id]), concentrates: [mg] })
    );
    expect(result.rows[0].drops).toBe(2);
    expect(result.rows[0].display).toBe("ml");
    expect(result.rows[0].high_drop_count).toBe(false);
  });

  it("leads with mL and flags over 60 drops", () => {
    const result = computeRecipe(
      input({ recipe: recipe("r", { Mg: 100 }, [mg.id]), concentrates: [mg] })
    );
    expect(result.rows[0].drops).toBe(67);
    expect(result.rows[0].display).toBe("ml");
    expect(result.rows[0].high_drop_count).toBe(true);
    expect(result.warnings.map((w) => w.code)).toContain("high_drop_count");
  });

  it("leads with drops in between", () => {
    const result = computeRecipe(
      input({ recipe: recipe("r", { Mg: 15 }, [mg.id]), concentrates: [mg] })
    );
    expect(result.rows[0].display).toBe("drops");
  });

  it("rescales with the water volume", () => {
    const forTwoLitres = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id]),
        concentrates: [mg],
        volume_l: 2,
      })
    );
    expect(forTwoLitres.rows[0].drops).toBe(20);
    // Concentration is per litre, so the summary line does not change.
    expect(forTwoLitres.gh_caco3).toBeCloseTo(15 * 4.118, 6);
  });

  it("rescales with the dropper calibration", () => {
    const fineDropper = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id]),
        concentrates: [mg],
        drops_per_ml: 25,
      })
    );
    // Smaller drops, so more of them for the same 0,5 mL.
    expect(fineDropper.rows[0].ml).toBeCloseTo(0.5, 6);
    expect(fineDropper.rows[0].drops).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

describe("guards", () => {
  const ca = concentrateAtIonPpm("ca-30k", MINERALS.calcium_chloride, 30_000);
  const khco3 = concentrateAtIonPpm("khco3-30k", MINERALS.khco3, 30_000);

  it("warns when Ca × HCO3 exceeds the precipitation threshold", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Ca: 60, HCO3: 60 }, [ca.id, khco3.id]),
        concentrates: [ca, khco3],
      })
    );
    // 60 × 60 = 3600, over the 2000 threshold.
    expect(result.warnings.map((w) => w.code)).toContain("precipitation_risk");
  });

  it("warns below the KH floor", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Ca: 25, HCO3: 10 }, [ca.id, khco3.id]),
        concentrates: [ca, khco3],
      })
    );
    expect(result.kh_caco3).toBeLessThan(20);
    expect(result.warnings.map((w) => w.code)).toContain("kh_below_floor");
  });

  it("warns above the KH ceiling", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Ca: 25, HCO3: 100 }, [ca.id, khco3.id]),
        concentrates: [ca, khco3],
      })
    );
    expect(result.kh_caco3).toBeGreaterThan(75);
    expect(result.warnings.map((w) => w.code)).toContain("kh_above_ceiling");
  });

  it("stays quiet inside the guard band", () => {
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Ca: 25, HCO3: 40 }, [ca.id, khco3.id]),
        concentrates: [ca, khco3],
      })
    );
    expect(result.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Sensory plane
// ---------------------------------------------------------------------------

describe("sensory plane", () => {
  it("puts high buffer on the sweet side and low buffer on the bright side", () => {
    const sweet = planeFor({ Ca: 20, Mg: 10, HCO3: 60 });
    const bright = planeFor({ Ca: 20, Mg: 10, HCO3: 5 });
    expect(sweet.x).toBeLessThan(bright.x);
  });

  it("puts high hardness at the strong end", () => {
    expect(planeFor({ Mg: 40 }).y).toBeGreaterThan(planeFor({ Mg: 10 }).y);
  });

  it("clamps to the unit square", () => {
    const extreme = planeFor({ Ca: 500, Mg: 500, HCO3: 0, Na: 400 });
    expect(extreme.x).toBeGreaterThanOrEqual(-1);
    expect(extreme.x).toBeLessThanOrEqual(1);
    expect(extreme.y).toBeGreaterThanOrEqual(-1);
    expect(extreme.y).toBeLessThanOrEqual(1);
  });

  it("survives water with no hardness at all", () => {
    expect(planeFor({})).toEqual({ x: 0, y: -1 });
    expect(planeFor({ HCO3: 30 })).toEqual({ x: -1, y: -1 });
  });

  it("places the named recipes where their authors describe them", () => {
    // docs/02: Melbourne is very soft, Rao/Perger is sweet-side and strong.
    const melbourne = planeFor({ Ca: 6, Mg: 2, HCO3: 15 });
    const rao = planeFor({ Mg: 24.3, HCO3: 61 });
    expect(melbourne.y).toBeLessThan(rao.y);
  });

  it("uses Juliana's override when she supplied one", () => {
    const mg = concentrateAtIonPpm("mg-30k", MINERALS.epsom, 30_000);
    const result = computeRecipe(
      input({
        recipe: recipe("r", { Mg: 15 }, [mg.id], {
          plane: { x: 0.42, y: -0.17 },
          plane_is_override: true,
        }),
        concentrates: [mg],
      })
    );
    expect(result.plane).toEqual({ x: 0.42, y: -0.17 });
    expect(result.plane_is_override).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Blocked on Juliana — see docs/01 § Open questions
// ---------------------------------------------------------------------------

describe("fixtures blocked on Juliana's answers", () => {
  it.todo(
    "reproduces every preset in Juliana's spreadsheet " +
      "— OPEN QUESTION 1: is '30.000 ppm' ppm of the ion or of the salt? " +
      "Same bottle, 1.6× different drop counts. The engine already tracks both " +
      "readings through salt_g (see 'needs 33 gotas…' above); only this fixture's " +
      "expected numbers depend on the answer."
  );

  it.todo(
    "uses the course's standard dropper " +
      "— OPEN QUESTION 2: does the course ship or name a conta-gotas? " +
      "If yes, v_gota is fixed and the onboarding calibration screen is dropped; " +
      "if no, 20 gotas/mL stays a per-device default. Every drop count above " +
      "assumes 20 gotas/mL."
  );

  it.todo(
    "matches Juliana's own guard thresholds " +
      "— her precipitation product and KH floor/ceiling are placeholders here " +
      "(2000 / 20 / 75, from docs/03's examples)."
  );
});
