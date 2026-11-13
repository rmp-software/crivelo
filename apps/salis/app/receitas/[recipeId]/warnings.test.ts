/**
 * The copy layer's tests — STRING LEVEL ONLY. Read this before trusting them
 * for DOM coverage, because there is none.
 *
 * The issue's test step 2 is "grep the rendered DOM for the raw codes — zero
 * hits". That was done, in a real browser at 390×844, and the evidence is
 * committed-adjacent at `.playwright-mcp/rmp-258-dom-grep.json` (gitignored,
 * local). It is NOT re-run here: `vitest.config.ts` is node-only on purpose —
 * the engine is a pure module and the device store stubs its two browser APIs
 * in memory — so there is no renderer in this suite to grep. Pulling jsdom in
 * to assert one property would cost the whole suite its environment.
 *
 * What stands in for it is the pair below: `warningText` is the only road from
 * a code to the screen (`WARNING_COPY` is total, so there is no fallback branch
 * that could print `warning.code`), and "no sentence contains any raw code"
 * is asserted over the real union for every code at once.
 *
 * If a code ever gains a path to the DOM that does NOT go through
 * `warningText` — a `data-` attribute, an analytics id, a key, a class name
 * built from the code — that is the moment this stops being sufficient. Add a
 * rendering test then, in its own file carrying vitest's per-file environment
 * pragma for jsdom, rather than switching the whole suite's environment. (The
 * pragma is deliberately not spelled out here: vitest greps source files for
 * it, so writing it even inside a comment pulls jsdom into THIS file.)
 */
import { describe, expect, it } from "vitest";
import { computeRecipe, type Warning, type WarningCode } from "@/engine/dosing";
import type { BaseWater, Guards, Recipe } from "@/engine/types";
import { content } from "../../content";
import {
  WARNING_COPY,
  recipeWarningTexts,
  rowWarningText,
  warningText,
} from "./warnings";

/**
 * Every code the engine can emit.
 *
 * `WARNING_COPY` is already a total `Record<WarningCode, …>`, so a new code with
 * no copy is a type error before it is a test failure. This list exists for the
 * case the type cannot catch: half these codes are row-scoped and reach the DOM
 * by a different path than the other half, so an entry can be present and still
 * never render. Keeping the roll call here forces whoever adds the sixth code to
 * decide which path it takes.
 */
const ALL_CODES: WarningCode[] = [
  "base_water_covers",
  "high_drop_count",
  "precipitation_risk",
  "kh_below_floor",
  "kh_above_ceiling",
];

/**
 * One sample warning per code, for the properties that have to hold across all
 * five regardless of which numbers they were handed.
 *
 * A map keyed by the union rather than one shared context bag: `Warning` is
 * discriminated now, so each code's context is its own shape and a sixth code
 * cannot be added without a sample to exercise it.
 */
const SAMPLE_WARNING: { [C in WarningCode]: Extract<Warning, { code: C }> } = {
  base_water_covers: {
    code: "base_water_covers",
    context: {
      concentrate_id: "khco3-30k",
      ion: "HCO3",
      target: 40,
      base: 110.8,
      base_water: "Minalba",
    },
  },
  high_drop_count: {
    code: "high_drop_count",
    context: { concentrate_id: "khco3-30k", drops: 65, ml: 3.27, ceiling: 60 },
  },
  precipitation_risk: {
    code: "precipitation_risk",
    context: { product: 784, threshold: 500, Ca: 28, HCO3: 28 },
  },
  kh_below_floor: { code: "kh_below_floor", context: { kh: 22, floor: 30 } },
  kh_above_ceiling: { code: "kh_above_ceiling", context: { kh: 91, ceiling: 75 } },
};

/** The recipes and bottles the app actually ships, so the copy is fed real context. */
const RECIPE_BY_ID = new Map(content.recipes.map((recipe) => [recipe.id, recipe]));
const BASE_WATER_BY_ID = new Map(
  content.base_waters.map((water) => [water.id, water]),
);

function recipe(id: string): Recipe {
  const found = RECIPE_BY_ID.get(id);
  if (!found) throw new Error(`no recipe ${id} in content.json`);
  return found;
}

function baseWater(id: string): BaseWater {
  const found = BASE_WATER_BY_ID.get(id);
  if (!found) throw new Error(`no base water ${id} in content.json`);
  return found;
}

/**
 * Drive the real engine over the real content until a guard trips.
 *
 * Forcing the codes by hand-building `Warning` objects would test the copy
 * against context this app never produces. Every case below moves one knob a
 * student or Juliana can move — the water volume, the starting water, a guard
 * threshold in her sheet — which is also how each one was fired in the browser.
 */
function warningsFor(options: {
  recipeId: string;
  baseWaterId?: string;
  volume_l?: number;
  guards?: Partial<Guards>;
}): Warning[] {
  return computeRecipe({
    recipe: recipe(options.recipeId),
    baseWater: baseWater(options.baseWaterId ?? "destilada"),
    concentrates: content.concentrates,
    minerals: content.minerals,
    guards: { ...content.guards, ...options.guards },
    drops_per_ml: content.guards.default_drops_per_ml,
    volume_l: options.volume_l ?? 1,
  }).warnings;
}

describe("WARNING_COPY", () => {
  it("covers every code the engine can emit", () => {
    expect(Object.keys(WARNING_COPY).sort()).toEqual([...ALL_CODES].sort());
  });

  it("gives every code a scope", () => {
    for (const code of ALL_CODES) {
      expect(["recipe", "row"]).toContain(WARNING_COPY[code].scope);
    }
  });

  it("never lets a raw code reach the screen", () => {
    // Underscores are the tell: every code has one, no Portuguese sentence does.
    for (const code of ALL_CODES) {
      const text = warningText(SAMPLE_WARNING[code]);
      expect(text).not.toContain(code);
      expect(text).not.toMatch(/_/);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("leaks no raw code into any sentence, over the real union", () => {
    // The string-level stand-in for the issue's DOM grep (see this file's
    // header). Every code against every sentence, not each against its own:
    // the failure that matters is a code appearing where it was never meant
    // to. The code list comes off `WARNING_COPY` — the total `Record` keyed by
    // the union — so a sixth code joins this assertion by existing.
    const codes = Object.keys(WARNING_COPY) as WarningCode[];
    const sentences = codes.map((code) => warningText(SAMPLE_WARNING[code]));

    for (const sentence of sentences) {
      for (const code of codes) {
        expect(sentence).not.toContain(code);
      }
    }
  });

  it("follows the voice rules", () => {
    for (const code of ALL_CODES) {
      const text = warningText(SAMPLE_WARNING[code]);
      // Full sentence with a terminal period, no exclamation marks, no emoji.
      expect(text).toMatch(/\.$/);
      expect(text).not.toContain("!");
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      // Sentence case: the first word is capitalised, and nothing SHOUTS.
      expect(text[0]).toBe(text[0].toUpperCase());
      expect(text).not.toMatch(/\b[A-ZÀ-Ü]{3,}\b/);
    }
  });
});

describe("recipe-scoped warnings", () => {
  it("renders 'pode ficar ácida' when KH is under Juliana's floor", () => {
    // *Leve* sits at KH 22. Raise her floor over it and the guard trips — the
    // same knob as a row in `guards.csv`.
    const warnings = warningsFor({
      recipeId: "leve",
      guards: { kh_floor_caco3: 30 },
    });

    expect(warnings.map((warning) => warning.code)).toContain("kh_below_floor");
    expect(recipeWarningTexts(warnings)).toEqual([
      "Alcalinidade baixa. A água pode ficar ácida.",
    ]);
  });

  it("renders 'pode ficar chata' when KH is over her ceiling", () => {
    // Minalba carries HCO3 110,8 mg/L on its own — KH 91, past the shipped 75.
    const warnings = warningsFor({
      recipeId: "equilibrada",
      baseWaterId: "minalba",
    });

    expect(recipeWarningTexts(warnings)).toContain(
      "Alcalinidade alta. A água pode ficar chata.",
    );
  });

  it("renders the precipitation warning when Ca × HCO3 is over the threshold", () => {
    // *Mais brilhante* is the calcium-dominant preset: 28 × 28 = 784.
    const warnings = warningsFor({
      recipeId: "mais-brilhante",
      guards: { precip_ca_hco3_product: 500 },
    });

    expect(recipeWarningTexts(warnings)).toEqual([
      "Cálcio e bicarbonato altos na mesma água. Pode deixar um depósito branco na água pronta.",
    ]);
  });
});

describe("row-scoped warnings", () => {
  it("names the ion already present in the starting water", () => {
    // Minalba's bicarbonate exceeds every preset's target, so the KHCO3 row
    // doses nothing. Its magnesium exceeds *Leve*'s too.
    const warnings = warningsFor({ recipeId: "leve", baseWaterId: "minalba" });

    expect(rowWarningText(warnings, "khco3-30k")).toBe(
      "Bicarbonato já presente na água de partida.",
    );
    expect(rowWarningText(warnings, "mg-30k")).toBe(
      "Magnésio já presente na água de partida.",
    );
  });

  it("points at the syringe past the drop ceiling, with pt-BR numbers", () => {
    // 2 L of *Equilibrada* needs 65 drops of KHCO3 — the shipped ceiling is 60.
    const warnings = warningsFor({ recipeId: "equilibrada", volume_l: 2 });

    expect(rowWarningText(warnings, "khco3-30k")).toBe(
      "Mais de 60 gotas. Meça 3,27 mL na seringa.",
    );
  });

  it("keeps row-scoped copy out of the recipe's list", () => {
    const warnings = warningsFor({ recipeId: "equilibrada", volume_l: 2 });

    expect(warnings.map((warning) => warning.code)).toContain("high_drop_count");
    expect(recipeWarningTexts(warnings)).toEqual([]);
  });

  it("says nothing for a row the engine did not flag", () => {
    const warnings = warningsFor({ recipeId: "equilibrada", volume_l: 2 });

    expect(rowWarningText(warnings, "mg-30k")).toBeUndefined();
  });
});
