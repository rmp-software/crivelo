import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Report, buildContent } from "../../scripts/import-content.ts";

const TEMPLATE_DIR = join(import.meta.dirname, "..", "..", "content-template");

type Sources = Parameters<typeof buildContent>[0];

/** The shipped template, which must import clean on day one. */
function templateSources(): Sources {
  const read = (file: string) => readFileSync(join(TEMPLATE_DIR, file), "utf8");
  return {
    minerals: read("minerals.csv"),
    concentrates: read("concentrates.csv"),
    recipes: read("recipes.csv"),
    equivalences: read("equivalences.csv"),
    base_waters: read("base_waters.csv"),
    guards: read("guards.csv"),
    lessons: read("lessons.csv"),
  };
}

/** Import the template with one tab swapped for a deliberately broken one. */
function importWith(overrides: Partial<Sources>) {
  const report = new Report();
  const content = buildContent({ ...templateSources(), ...overrides }, report);
  return { content, report };
}

function messages(report: Report): string {
  return report.errors.map((problem) => problem.message).join("\n");
}

describe("the shipped template", () => {
  const { content, report } = importWith({});

  it("imports with no errors", () => {
    expect(messages(report)).toBe("");
    expect(report.errors).toHaveLength(0);
  });

  it("produces the minimum content the plan asks for", () => {
    expect(content.minerals.length).toBeGreaterThanOrEqual(6);
    expect(content.recipes.length).toBeGreaterThanOrEqual(3);
    expect(content.lessons.length).toBeGreaterThanOrEqual(5);
    expect(content.base_waters.some((water) => water.id === "destilada")).toBe(true);
  });

  it("derives ion fractions from the formulas rather than copying a column", () => {
    const epsom = content.minerals.find((m) => m.id === "mgso4-7h2o")!;
    // The heptahydrate figure, not the anhydrous 0.2019.
    expect(epsom.ion_mass_fraction).toBeCloseTo(0.0986, 4);
    expect(epsom.molar_mass).toBeCloseTo(246.466, 2);
    expect(epsom.counter_ion_mass_fraction).toBeCloseTo(0.39, 2);
  });

  it("derives every concentrate to ~30 mg of ion per mL", () => {
    for (const stock of content.concentrates) {
      expect(stock.ion_mg_per_ml).toBeGreaterThan(29.9);
      expect(stock.ion_mg_per_ml).toBeLessThan(30.1);
    }
  });

  it('reproduces "GH 124 · KH 25" for Mais doce, as printed in docs/01', () => {
    const maisDoce = content.recipes.find((r) => r.id === "mais-doce")!;
    expect(Math.round(maisDoce.gh_caco3)).toBe(124);
    expect(Math.round(maisDoce.kh_caco3)).toBe(25);
  });

  it("counts spectator ions in the TDS estimate", () => {
    // Targets alone sum to 70 mg/L; the potassium from KHCO3 and the chloride
    // from CaCl2 are really in the cup, so the estimate must be well above it.
    const maisDoce = content.recipes.find((r) => r.id === "mais-doce")!;
    expect(maisDoce.tds_estimate).toBeGreaterThan(150);
  });

  it("warns that the gypsum substitution can never be offered", () => {
    // CaSO4·2H2O is too insoluble to be a drop-dosed concentrate, so the
    // espresso-friendly CaCl2 → CaSO4 rule has no bottle behind it.
    expect(report.warnings.map((w) => w.message).join("\n")).toMatch(
      /no concentrate is defined for caso4-2h2o/
    );
  });
});

describe("referential integrity", () => {
  it("rejects a concentrate pointing at a mineral that does not exist", () => {
    const { report } = importWith({
      concentrates:
        "id;mineral_id;label_pt;salt_g;water_ml;shelf_life_days;storage_note;steps_pt\n" +
        "x-30k;nao-existe;X;10;500;90;;passo",
    });
    expect(messages(report)).toMatch(/mineral_id "nao-existe" does not exist/);
  });

  it("rejects a recipe listing a concentrate that does not exist", () => {
    const { report } = importWith({
      recipes:
        "id;name_pt;promise_pt;methods;target_Ca;target_Mg;target_HCO3;target_Na;target_K;concentrate_ids;espresso_safe;plane_x;plane_y;level\n" +
        "r;R;p;V60;0;15;0;0;0;nao-existe;não;;;iniciante",
    });
    expect(messages(report)).toMatch(/concentrate_id "nao-existe" does not exist/);
  });

  it("rejects duplicate ids, which would silently shadow a row", () => {
    const { report } = importWith({
      base_waters:
        "id;name_pt;Ca;Mg;HCO3;Na;K;source\n" +
        "destilada;Destilada / RO;0;0;0;0;0;x\n" +
        "dup;A;1;0;0;0;0;x\n" +
        "dup;B;2;0;0;0;0;x",
    });
    expect(messages(report)).toMatch(/duplicate id "dup"/);
  });
});

describe("recipe / concentrate agreement", () => {
  const header =
    "id;name_pt;promise_pt;methods;target_Ca;target_Mg;target_HCO3;target_Na;target_K;concentrate_ids;espresso_safe;plane_x;plane_y;level\n";

  it("rejects a target with no concentrate to supply it", () => {
    // Mg is targeted but only the bicarbonate stock is listed — the recipe
    // would silently under-dose forever.
    const { report } = importWith({
      recipes: `${header}r;R;p;V60;0;15;30;0;0;khco3-30k;não;;;iniciante`,
    });
    expect(messages(report)).toMatch(/target_Mg is set but no listed concentrate supplies Mg/);
  });

  it("rejects a concentrate whose ion the recipe does not target", () => {
    const { report } = importWith({
      recipes: `${header}r;R;p;V60;0;15;0;0;0;"mg-30k, khco3-30k";não;;;iniciante`,
    });
    expect(messages(report)).toMatch(
      /concentrate "khco3-30k" supplies HCO3, but target_HCO3 is blank or zero/
    );
  });

  it("warns, but does not fail, on an espresso-safe recipe carrying chloride", () => {
    // docs/03 makes this a warning so Juliana can override knowingly.
    const { report } = importWith({
      recipes: `${header}r;R;p;espresso;25;0;0;0;0;ca-30k;sim;;;avançado`,
    });
    expect(report.errors).toHaveLength(0);
    expect(report.warnings.map((w) => w.message).join("\n")).toMatch(
      /marked espresso_safe but uses chloride-bearing ca-30k/
    );
  });
});

describe("chemistry validation", () => {
  const header =
    "id;name_pt;formula;ion;counter_ion;sensory_note;espresso_safe;buy_url\n";

  it("rejects an unknown element rather than shipping a zero fraction", () => {
    const { report } = importWith({
      minerals: `${header}x;X;XyCl2;Ca;Cl;;sim;`,
    });
    expect(messages(report)).toMatch(/unknown element "Xy"/);
  });

  it("rejects a formula that does not contain the ion it claims", () => {
    const { report } = importWith({
      minerals: `${header}x;X;NaHCO3;Ca;none;;sim;`,
    });
    expect(messages(report)).toMatch(/contains no Ca/);
  });

  it("rejects a formula that does not contain its counter-ion", () => {
    const { report } = importWith({
      minerals: `${header}x;X;KHCO3;HCO3;Cl;;sim;`,
    });
    expect(messages(report)).toMatch(/contains no Cl/);
  });

  it("rejects an ion outside the enum", () => {
    const { report } = importWith({
      minerals: `${header}x;X;KHCO3;Potassio;none;;sim;`,
    });
    expect(messages(report)).toMatch(/ion must be one of/);
  });
});

describe("equivalences", () => {
  const header = "from_mineral_id;to_mineral_id;shared_ion;note_pt;espresso_note_pt\n";

  it("rejects a shared_ion that is not the ion of both minerals", () => {
    const { report } = importWith({
      equivalences: `${header}khco3;nahco3;Ca;nota;`,
    });
    expect(messages(report)).toMatch(/shared_ion is Ca but khco3 supplies HCO3/);
  });

  it("rejects a rule pointing at a mineral that does not exist", () => {
    const { report } = importWith({
      equivalences: `${header}khco3;nao-existe;HCO3;nota;`,
    });
    expect(messages(report)).toMatch(/to_mineral_id "nao-existe" does not exist/);
  });

  it("derives the salt-mass conversion factor from both formulas", () => {
    const { content } = importWith({});
    const rule = content.equivalences.find((e) => e.to_mineral_id === "nahco3")!;
    // KHCO3 is 0.6095 HCO3, NaHCO3 is 0.7263 → 0.839 g of NaHCO3 per g of KHCO3.
    expect(rule.factor).toBeCloseTo(0.839, 3);
  });
});

describe("base waters", () => {
  it('requires a "destilada" profile', () => {
    const { report } = importWith({
      base_waters: "id;name_pt;Ca;Mg;HCO3;Na;K;source\nx;X;1;0;0;0;0;y",
    });
    expect(messages(report)).toMatch(/"destilada" is required/);
  });

  it('requires "destilada" to be all zeros', () => {
    const { report } = importWith({
      base_waters:
        "id;name_pt;Ca;Mg;HCO3;Na;K;source\ndestilada;Destilada / RO;5;0;0;0;0;y",
    });
    expect(messages(report)).toMatch(/must have every ion at zero/);
  });

  it("reads Brazilian decimals", () => {
    const { content } = importWith({});
    const light = content.base_waters.find((w) => w.id === "exemplo-mineral-leve")!;
    expect(light.Ca).toBe(6.2);
    expect(light.HCO3).toBe(18);
  });
});

describe("guards", () => {
  it("rejects a missing required key", () => {
    const { report } = importWith({ guards: "key;value\nkh_floor_caco3;20" });
    expect(messages(report)).toMatch(/missing required key "precip_ca_hco3_product"/);
  });

  it("rejects a floor at or above the ceiling", () => {
    const { report } = importWith({
      guards:
        "key;value\nprecip_ca_hco3_product;2000\nkh_floor_caco3;80\nkh_ceiling_caco3;75\n" +
        "drops_show_ml_below;3\ndrops_show_ml_above;60\ndefault_drops_per_ml;20",
    });
    expect(messages(report)).toMatch(/kh_floor_caco3 must be below kh_ceiling_caco3/);
  });
});

describe("lessons", () => {
  it("sorts by the order column", () => {
    const { content } = importWith({});
    const orders = content.lessons.map((lesson) => lesson.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it("keeps markdown newlines intact through the CSV", () => {
    const { content } = importWith({});
    const lesson = content.lessons.find((l) => l.id === "como-preparar-concentrados")!;
    expect(lesson.body_md).toContain("\n");
    expect(lesson.body_md).toMatch(/1\. Pese o sal/);
  });
});

describe("regressions — defects found in adversarial review", () => {
  const header =
    "id;name_pt;promise_pt;methods;target_Ca;target_Mg;target_HCO3;target_Na;target_K;concentrate_ids;espresso_safe;plane_x;plane_y;level\n";

  it("rejects the same concentrate listed twice", () => {
    // A one-character CSV typo used to import clean and produce two identical
    // rows, each dosing the FULL target — double the mineral in the jug, while
    // the GH/KH summary still read correct and hid it.
    const { report } = importWith({
      recipes: `${header}r;R;p;V60;25;15;30;0;0;"mg-30k, mg-30k, ca-30k, khco3-30k";não;;;iniciante`,
    });
    expect(messages(report)).toMatch(/"mg-30k" is listed more than once/);
  });

  it("rejects two different concentrates supplying the same ion", () => {
    // Same failure, different shape: both would be dosed the full target_Mg.
    const { report } = importWith({
      recipes: `${header}r;R;p;V60;0;15;30;0;0;"mg-30k, mgcl2-30k, khco3-30k";não;;;iniciante`,
    });
    expect(messages(report)).toMatch(/both supply Mg/);
  });

  it("accepts the shipped template, which has one concentrate per ion", () => {
    const { report } = importWith({});
    expect(messages(report)).toBe("");
  });

  it("rejects an ion concentration above the sanity ceiling", () => {
    // Catches the residual decimal ambiguity: "3.141" reads as 3141 in pt-BR.
    const { report } = importWith({
      base_waters:
        "id;name_pt;Ca;Mg;HCO3;Na;K;source\n" +
        "destilada;Destilada / RO;0;0;0;0;0;x\n" +
        "suspeita;Suspeita;3.141;0;0;0;0;rótulo",
    });
    expect(messages(report)).toMatch(/above the 2000 mg\/L sanity ceiling/);
  });

  it("reads a sub-1 label value correctly instead of inflating it 1000×", () => {
    const { content, report } = importWith({
      base_waters:
        "id;name_pt;Ca;Mg;HCO3;Na;K;source\n" +
        "destilada;Destilada / RO;0;0;0;0;0;x\n" +
        "leve;Leve;6,2;1,5;18,0;4,1;0.800;rótulo",
    });
    expect(report.errors).toHaveLength(0);
    expect(content.base_waters.find((w) => w.id === "leve")!.K).toBe(0.8);
  });
});
