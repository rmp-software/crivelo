#!/usr/bin/env node
/**
 * Import Juliana's spreadsheet tabs (exported as CSV) into content/content.json.
 *
 * Run it with plain `node` — Node 24 strips TypeScript natively, which is why
 * the relative imports below carry explicit `.ts` extensions and why this
 * script needs no ts-node/tsx dependency:
 *
 *     node scripts/import-content.ts
 *     node scripts/import-content.ts --in content-template --out content
 *
 * This is the ONE place chemistry enters the system. Every derived figure —
 * molar masses, ion mass fractions, mg of ion per mL, GH/KH, plane coordinates
 * — is computed here from the formula Juliana typed, so the app never re-derives
 * chemistry at runtime and no fraction is ever hand-entered.
 *
 * It is also the one place her sheet can be rejected. Validation failures are
 * collected and reported together (not thrown one at a time), because a content
 * editor fixing six problems wants six messages, not six runs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import {
  ionAsCaCO3Factor,
  ionFractions,
  ionMassFraction,
  molarMass,
} from "../engine/chemistry.ts";
import { computeRecipe, planeFor } from "../engine/dosing.ts";
import {
  parseBoolean,
  parseCsvRecords,
  parseDecimal,
  parseList,
  type CsvRecord,
} from "../engine/csv.ts";
import {
  COUNTER_IONS,
  LEVELS,
  REQUIRED_GUARD_KEYS,
  TARGET_IONS,
  type BaseWater,
  type Concentrate,
  type Content,
  type Equivalence,
  type Guards,
  type IonProfile,
  type Lesson,
  type Level,
  type Mineral,
  type Recipe,
  type TargetIon,
} from "../engine/types.ts";

/** One file per spreadsheet tab. The Portuguese names are Juliana's tabs. */
const FILES = {
  minerals: { file: "minerals.csv", tab: "Sais" },
  concentrates: { file: "concentrates.csv", tab: "Concentrados" },
  recipes: { file: "recipes.csv", tab: "Receitas" },
  equivalences: { file: "equivalences.csv", tab: "Substituições" },
  base_waters: { file: "base_waters.csv", tab: "Águas de partida" },
  guards: { file: "guards.csv", tab: "Limites" },
  lessons: { file: "lessons.csv", tab: "Aprender" },
} as const;

// ---------------------------------------------------------------------------
// Problem collection
// ---------------------------------------------------------------------------

interface Problem {
  severity: "error" | "warning";
  where: string;
  message: string;
}

class Report {
  readonly problems: Problem[] = [];

  error(where: string, message: string): void {
    this.problems.push({ severity: "error", where, message });
  }

  warn(where: string, message: string): void {
    this.problems.push({ severity: "warning", where, message });
  }

  get errors(): Problem[] {
    return this.problems.filter((p) => p.severity === "error");
  }

  get warnings(): Problem[] {
    return this.problems.filter((p) => p.severity === "warning");
  }
}

/** `Sais` row 3 (mgso4-7h2o) — enough to find the cell in a spreadsheet. */
function at(tab: string, index: number, id?: string): string {
  const row = index + 2; // +1 for the header, +1 for 1-based spreadsheet rows
  return id ? `${tab} row ${row} (${id})` : `${tab} row ${row}`;
}

function requireText(record: CsvRecord, column: string, where: string, report: Report): string {
  const value = (record[column] ?? "").trim();
  if (value === "") report.error(where, `${column} is required`);
  return value;
}

function requireNumber(
  record: CsvRecord,
  column: string,
  where: string,
  report: Report
): number {
  const value = parseDecimal(record[column] ?? "");
  if (Number.isNaN(value)) {
    report.error(where, `${column} must be a number, got "${record[column] ?? ""}"`);
    return 0;
  }
  return value;
}

/** Blank means zero, which is what a blank target column means in her sheet. */
function optionalNumber(record: CsvRecord, column: string): number {
  const value = parseDecimal(record[column] ?? "");
  return Number.isNaN(value) ? 0 : value;
}

function requireEnum<T extends string>(
  record: CsvRecord,
  column: string,
  allowed: readonly T[],
  where: string,
  report: Report
): T {
  const value = (record[column] ?? "").trim();
  if (!allowed.includes(value as T)) {
    report.error(
      where,
      `${column} must be one of ${allowed.join(" | ")}, got "${value}"`
    );
    return allowed[0];
  }
  return value as T;
}

function requireBoolean(
  record: CsvRecord,
  column: string,
  where: string,
  report: Report
): boolean {
  const value = parseBoolean(record[column] ?? "");
  if (value === undefined) {
    report.error(where, `${column} must be sim/não, got "${record[column] ?? ""}"`);
    return false;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Tab readers
// ---------------------------------------------------------------------------

function readMinerals(records: CsvRecord[], report: Report): Mineral[] {
  const tab = FILES.minerals.tab;

  return records.map((record, index) => {
    const id = requireText(record, "id", at(tab, index), report);
    const where = at(tab, index, id);
    const formula = requireText(record, "formula", where, report);
    const ion = requireEnum(record, "ion", TARGET_IONS, where, report);
    const counter_ion = requireEnum(record, "counter_ion", COUNTER_IONS, where, report);

    // Chemistry. An unparseable formula is fatal for this row, so fall back to
    // zeroes and let the collected error stop the build — never ship a 0 figure.
    let mass = 0;
    let fraction = 0;
    let counterFraction = 0;
    let fractions: IonProfile = {};
    try {
      mass = molarMass(formula);
      fraction = ionMassFraction(formula, ion);
      // No cast: the `!== "none"` check narrows CounterIon to exactly the
      // members that are real ions, which is what ionMassFraction accepts.
      counterFraction = counter_ion === "none" ? 0 : ionMassFraction(formula, counter_ion);
      fractions = ionFractions(formula);

      if (fraction <= 0) {
        report.error(where, `formula "${formula}" contains no ${ion}`);
      }
      if (counter_ion !== "none" && counterFraction <= 0) {
        report.error(where, `formula "${formula}" contains no ${counter_ion}`);
      }
    } catch (cause) {
      report.error(where, (cause as Error).message);
    }

    return {
      id,
      name_pt: requireText(record, "name_pt", where, report),
      formula,
      ion,
      counter_ion,
      sensory_note: (record.sensory_note ?? "").trim(),
      espresso_safe: requireBoolean(record, "espresso_safe", where, report),
      buy_url: (record.buy_url ?? "").trim() || undefined,
      molar_mass: mass,
      ion_mass_fraction: fraction,
      counter_ion_mass_fraction: counterFraction,
      ion_as_caco3_factor: ionAsCaCO3Factor(ion),
      ion_fractions: fractions,
    };
  });
}

function readConcentrates(
  records: CsvRecord[],
  mineralById: Map<string, Mineral>,
  report: Report
): Concentrate[] {
  const tab = FILES.concentrates.tab;

  return records.map((record, index) => {
    const id = requireText(record, "id", at(tab, index), report);
    const where = at(tab, index, id);
    const mineral_id = requireText(record, "mineral_id", where, report);
    const mineral = mineralById.get(mineral_id);
    if (mineral_id && !mineral) {
      report.error(where, `mineral_id "${mineral_id}" does not exist in ${FILES.minerals.tab}`);
    }

    const salt_g = requireNumber(record, "salt_g", where, report);
    const water_ml = requireNumber(record, "water_ml", where, report);
    if (water_ml <= 0) report.error(where, "water_ml must be greater than zero");
    if (salt_g <= 0) report.error(where, "salt_g must be greater than zero");

    // The derivation from docs/03: mg of the target ion per mL of concentrate.
    const ion_mg_per_ml =
      mineral && water_ml > 0 ? (salt_g * mineral.ion_mass_fraction * 1000) / water_ml : 0;

    return {
      id,
      mineral_id,
      label_pt: requireText(record, "label_pt", where, report),
      salt_g,
      water_ml,
      shelf_life_days: requireNumber(record, "shelf_life_days", where, report),
      storage_note: (record.storage_note ?? "").trim(),
      steps_pt: record.steps_pt ?? "",
      ion: mineral?.ion ?? "Ca",
      ion_mg_per_ml,
    };
  });
}

function readRecipes(
  records: CsvRecord[],
  concentrateById: Map<string, Concentrate>,
  mineralById: Map<string, Mineral>,
  distilled: BaseWater,
  guards: Guards,
  report: Report
): Recipe[] {
  const tab = FILES.recipes.tab;

  return records.map((record, index) => {
    const id = requireText(record, "id", at(tab, index), report);
    const where = at(tab, index, id);

    const targets: IonProfile = {};
    for (const ion of TARGET_IONS) {
      const value = optionalNumber(record, `target_${ion}`);
      if (value < 0) report.error(where, `target_${ion} cannot be negative`);
      if (value > 0) targets[ion] = value;
    }

    const concentrate_ids = parseList(record.concentrate_ids ?? "");
    if (concentrate_ids.length === 0) {
      report.error(where, "concentrate_ids is required");
    }

    // Every listed concentrate must exist, and must supply an ion this recipe
    // actually targets — otherwise the row would compute zero drops forever.
    const suppliedIons = new Set<TargetIon>();
    for (const concentrateId of concentrate_ids) {
      const concentrate = concentrateById.get(concentrateId);
      if (!concentrate) {
        report.error(
          where,
          `concentrate_id "${concentrateId}" does not exist in ${FILES.concentrates.tab}`
        );
        continue;
      }
      if ((targets[concentrate.ion] ?? 0) <= 0) {
        report.error(
          where,
          `concentrate "${concentrateId}" supplies ${concentrate.ion}, but target_${concentrate.ion} is blank or zero`
        );
      }
      suppliedIons.add(concentrate.ion);
    }

    // And every targeted ion needs a source, or the recipe silently under-doses.
    for (const ion of TARGET_IONS) {
      if ((targets[ion] ?? 0) > 0 && !suppliedIons.has(ion)) {
        report.error(where, `target_${ion} is set but no listed concentrate supplies ${ion}`);
      }
    }

    const espresso_safe = requireBoolean(record, "espresso_safe", where, report);
    if (espresso_safe) {
      // A warning, not an error, so Juliana can override knowingly (docs/03).
      const chloride = concentrate_ids.filter((concentrateId) => {
        const concentrate = concentrateById.get(concentrateId);
        const mineral = concentrate && mineralById.get(concentrate.mineral_id);
        return mineral?.counter_ion === "Cl";
      });
      if (chloride.length > 0) {
        report.warn(
          where,
          `marked espresso_safe but uses chloride-bearing ${chloride.join(", ")} — the app will withhold the badge`
        );
      }
    }

    const planeX = parseDecimal(record.plane_x ?? "");
    const planeY = parseDecimal(record.plane_y ?? "");
    const hasOverride = !Number.isNaN(planeX) && !Number.isNaN(planeY);
    if (Number.isNaN(planeX) !== Number.isNaN(planeY)) {
      report.error(where, "plane_x and plane_y must be given together or both left blank");
    }
    if (hasOverride && (Math.abs(planeX) > 1 || Math.abs(planeY) > 1)) {
      report.error(where, "plane_x and plane_y must be within [-1, 1]");
    }

    const recipe: Recipe = {
      id,
      name_pt: requireText(record, "name_pt", where, report),
      promise_pt: (record.promise_pt ?? "").trim(),
      methods: parseList(record.methods ?? ""),
      target_Ca: targets.Ca ?? 0,
      target_Mg: targets.Mg ?? 0,
      target_HCO3: targets.HCO3 ?? 0,
      target_Na: targets.Na ?? 0,
      target_K: targets.K ?? 0,
      concentrate_ids,
      espresso_safe,
      level: requireEnum(record, "level", LEVELS, where, report) as Level,
      targets,
      plane: hasOverride ? { x: planeX, y: planeY } : planeFor(targets),
      plane_is_override: hasOverride,
      gh_caco3: 0,
      kh_caco3: 0,
      tds_estimate: 0,
    };

    // Derive the card's summary figures by running the REAL engine against
    // distilled water, rather than computing them from the targets here.
    //
    // Targets alone would miss the spectator ions — a recipe built on NaHCO3
    // carries sodium that moves both the TDS estimate and the plane's Na term —
    // so a card derived from targets could disagree with the dosing screen that
    // shows the same recipe. One code path, one answer. Volume and dropper do
    // not affect these figures (they are concentrations), so "GH 124 · KH 25"
    // stays a stable property of the recipe.
    const summary = computeRecipe({
      recipe,
      baseWater: distilled,
      concentrates: [...concentrateById.values()],
      minerals: [...mineralById.values()],
      guards,
      drops_per_ml: guards.default_drops_per_ml,
      volume_l: 1,
    });

    recipe.gh_caco3 = summary.gh_caco3;
    recipe.kh_caco3 = summary.kh_caco3;
    recipe.tds_estimate = summary.tds_estimate;
    recipe.plane = summary.plane;

    return recipe;
  });
}

function readEquivalences(
  records: CsvRecord[],
  mineralById: Map<string, Mineral>,
  concentrates: Concentrate[],
  report: Report
): Equivalence[] {
  const tab = FILES.equivalences.tab;

  return records.map((record, index) => {
    const where = at(tab, index, record.from_mineral_id);
    const from_mineral_id = requireText(record, "from_mineral_id", where, report);
    const to_mineral_id = requireText(record, "to_mineral_id", where, report);
    const shared_ion = requireEnum(record, "shared_ion", TARGET_IONS, where, report);

    const from = mineralById.get(from_mineral_id);
    const to = mineralById.get(to_mineral_id);
    if (from_mineral_id && !from) report.error(where, `from_mineral_id "${from_mineral_id}" does not exist`);
    if (to_mineral_id && !to) report.error(where, `to_mineral_id "${to_mineral_id}" does not exist`);

    // docs/03: shared_ion must be the `ion` of BOTH minerals.
    if (from && from.ion !== shared_ion) {
      report.error(where, `shared_ion is ${shared_ion} but ${from.id} supplies ${from.ion}`);
    }
    if (to && to.ion !== shared_ion) {
      report.error(where, `shared_ion is ${shared_ion} but ${to.id} supplies ${to.ion}`);
    }

    // A rule whose substitute has no concentrate can never be offered: the
    // in-row swap only appears when the student OWNS a bottle of the substitute.
    if (to && !concentrates.some((c) => c.mineral_id === to.id)) {
      report.warn(
        where,
        `no concentrate is defined for ${to.id}, so this substitution can never be offered`
      );
    }

    const factor =
      from && to && to.ion_mass_fraction > 0
        ? from.ion_mass_fraction / to.ion_mass_fraction
        : 0;

    return {
      from_mineral_id,
      to_mineral_id,
      shared_ion,
      note_pt: requireText(record, "note_pt", where, report),
      espresso_note_pt: (record.espresso_note_pt ?? "").trim() || undefined,
      factor,
    };
  });
}

function readBaseWaters(records: CsvRecord[], report: Report): BaseWater[] {
  const tab = FILES.base_waters.tab;

  const waters = records.map((record, index) => {
    const id = requireText(record, "id", at(tab, index), report);
    const where = at(tab, index, id);

    const ions: IonProfile = {};
    for (const ion of TARGET_IONS) {
      const value = optionalNumber(record, ion);
      if (value < 0) report.error(where, `${ion} cannot be negative`);
      if (value > 0) ions[ion] = value;
    }

    return {
      id,
      name_pt: requireText(record, "name_pt", where, report),
      Ca: ions.Ca ?? 0,
      Mg: ions.Mg ?? 0,
      HCO3: ions.HCO3 ?? 0,
      Na: ions.Na ?? 0,
      K: ions.K ?? 0,
      source: (record.source ?? "").trim(),
      ions,
    };
  });

  // docs/03: `destilada` must exist, must be all zeros, and is the default.
  const distilled = waters.find((water) => water.id === "destilada");
  if (!distilled) {
    report.error(tab, 'a base water with id "destilada" is required and must be the default');
  } else if (Object.keys(distilled.ions).length > 0) {
    report.error(tab, '"destilada" must have every ion at zero');
  }

  return waters;
}

function readGuards(records: CsvRecord[], report: Report): Guards {
  const tab = FILES.guards.tab;
  const values: Record<string, number> = {};

  for (const [index, record] of records.entries()) {
    const key = (record.key ?? "").trim();
    if (!key) continue;
    const value = parseDecimal(record.value ?? "");
    if (Number.isNaN(value)) {
      report.error(at(tab, index, key), `value must be a number, got "${record.value ?? ""}"`);
      continue;
    }
    values[key] = value;
  }

  for (const key of REQUIRED_GUARD_KEYS) {
    if (!(key in values)) report.error(tab, `missing required key "${key}"`);
  }
  if (values.kh_floor_caco3 >= values.kh_ceiling_caco3) {
    report.error(tab, "kh_floor_caco3 must be below kh_ceiling_caco3");
  }
  if (values.drops_show_ml_below >= values.drops_show_ml_above) {
    report.error(tab, "drops_show_ml_below must be below drops_show_ml_above");
  }
  if (values.default_drops_per_ml <= 0) {
    report.error(tab, "default_drops_per_ml must be greater than zero");
  }

  return values as unknown as Guards;
}

function readLessons(records: CsvRecord[], report: Report): Lesson[] {
  const tab = FILES.lessons.tab;

  const lessons = records.map((record, index) => {
    const id = requireText(record, "id", at(tab, index), report);
    const where = at(tab, index, id);
    return {
      id,
      order: requireNumber(record, "order", where, report),
      title_pt: requireText(record, "title_pt", where, report),
      body_md: record.body_md ?? "",
    };
  });

  return lessons.sort((a, b) => a.order - b.order);
}

/** Flag ids that appear twice — a duplicate would shadow a row silently. */
function checkUniqueIds(
  rows: { id: string }[],
  tab: string,
  report: Report
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.id) continue;
    if (seen.has(row.id)) report.error(tab, `duplicate id "${row.id}"`);
    seen.add(row.id);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function buildContent(
  sources: Record<keyof typeof FILES, string>,
  report: Report
): Content {
  const minerals = readMinerals(parseCsvRecords(sources.minerals), report);
  checkUniqueIds(minerals, FILES.minerals.tab, report);
  const mineralById = new Map(minerals.map((m) => [m.id, m]));

  const concentrates = readConcentrates(
    parseCsvRecords(sources.concentrates),
    mineralById,
    report
  );
  checkUniqueIds(concentrates, FILES.concentrates.tab, report);
  const concentrateById = new Map(concentrates.map((c) => [c.id, c]));

  // Base waters and guards are read BEFORE recipes: deriving a recipe's summary
  // figures runs the real engine, which needs the distilled profile and the
  // guard thresholds.
  const base_waters = readBaseWaters(parseCsvRecords(sources.base_waters), report);
  checkUniqueIds(base_waters, FILES.base_waters.tab, report);
  const distilled =
    base_waters.find((water) => water.id === "destilada") ??
    ({ id: "destilada", name_pt: "Destilada / RO", Ca: 0, Mg: 0, HCO3: 0, Na: 0, K: 0, source: "", ions: {} } as BaseWater);

  const guards = readGuards(parseCsvRecords(sources.guards), report);

  const recipes = readRecipes(
    parseCsvRecords(sources.recipes),
    concentrateById,
    mineralById,
    distilled,
    guards,
    report
  );
  checkUniqueIds(recipes, FILES.recipes.tab, report);

  const equivalences = readEquivalences(
    parseCsvRecords(sources.equivalences),
    mineralById,
    concentrates,
    report
  );

  const lessons = readLessons(parseCsvRecords(sources.lessons), report);
  checkUniqueIds(lessons, FILES.lessons.tab, report);

  return {
    version: new Date().toISOString().slice(0, 10),
    generated_at: new Date().toISOString(),
    minerals,
    concentrates,
    recipes,
    equivalences,
    base_waters,
    guards,
    lessons,
  };
}

function main(): void {
  const { values } = parseArgs({
    options: {
      in: { type: "string", default: "content-template" },
      out: { type: "string", default: "content" },
    },
  });

  const inDir = resolve(values.in!);
  const outDir = resolve(values.out!);
  const report = new Report();

  const sources = {} as Record<keyof typeof FILES, string>;
  for (const [key, { file }] of Object.entries(FILES)) {
    const path = join(inDir, file);
    if (!existsSync(path)) {
      console.error(`✗ missing ${file} in ${inDir}`);
      process.exit(1);
    }
    sources[key as keyof typeof FILES] = readFileSync(path, "utf8");
  }

  const content = buildContent(sources, report);

  for (const problem of report.warnings) {
    console.warn(`⚠ ${problem.where}: ${problem.message}`);
  }
  for (const problem of report.errors) {
    console.error(`✗ ${problem.where}: ${problem.message}`);
  }

  if (report.errors.length > 0) {
    console.error(
      `\n✗ ${report.errors.length} error(s) — content/content.json was not written.`
    );
    process.exit(1);
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "content.json");
  writeFileSync(outPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");

  const counts = [
    `${content.minerals.length} minerals`,
    `${content.concentrates.length} concentrates`,
    `${content.recipes.length} recipes`,
    `${content.equivalences.length} equivalences`,
    `${content.base_waters.length} base waters`,
    `${content.lessons.length} lessons`,
  ].join(", ");

  console.log(`✓ ${outPath}`);
  console.log(`  ${counts}`);
  if (report.warnings.length > 0) {
    console.log(`  ${report.warnings.length} warning(s) above — not fatal.`);
  }
}

export { Report };

// Only run when invoked directly, so tests can import buildContent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
