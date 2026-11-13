import { describe, expect, it } from "vitest";
import { computeRecipe } from "@/engine/dosing";
import { content } from "../../../content";
import { formatMl } from "../format";
import { rowWarningText } from "../warnings";

/**
 * S3's dose tile shows the engine's ROW-scoped warning, and this is the pure
 * half of that claim.
 *
 * `prep-mode.tsx` renders `rowWarningText(result.warnings, row.concentrate_id)`
 * verbatim — the same call S2 makes for the same row (`../recipe-counter.tsx`
 * § RecipeCounter) — so the band's text is not a second copy of the sentence
 * and cannot drift from S2's. What a test CAN still catch is the regression
 * that shipped: a row the engine flagged whose screen says nothing. The
 * assertion below is therefore about the string S3 hands its band, not about
 * the pixels — `vitest.config.ts` is node-only on purpose (no DOM, see
 * `../warnings.test.ts` for the same split), and the rendering half was
 * verified in a real browser at 390×844.
 *
 * The over-ceiling case is driven with REAL content at a real volume rather
 * than a hand-built `Warning`: the defect was that the two screens disagreed
 * about an actual jug, so the fixture is an actual jug.
 */
describe("S3 row warning band", () => {
  const baseWater =
    content.base_waters.find((water) => water.id === "destilada") ??
    content.base_waters[0];

  const rowsFor = (recipeId: string, volumeL: number) =>
    computeRecipe({
      recipe: content.recipes.find((recipe) => recipe.id === recipeId)!,
      baseWater,
      concentrates: content.concentrates,
      minerals: content.minerals,
      guards: content.guards,
      drops_per_ml: content.guards.default_drops_per_ml,
      volume_l: volumeL,
    });

  // 2 L of "Equilibrada" is what put the bicarbonate row over the 60-drop
  // ceiling in the field. Asserted, not assumed: without this the test below
  // would pass vacuously the day a target changes.
  it("has an over-ceiling row at 2 L of Equilibrada", () => {
    const { rows } = rowsFor("equilibrada", 2);
    expect(rows.some((row) => row.high_drop_count)).toBe(true);
  });

  it("gives the over-ceiling row the syringe sentence", () => {
    const result = rowsFor("equilibrada", 2);
    const row = result.rows.find((candidate) => candidate.high_drop_count)!;

    const text = rowWarningText(result.warnings, row.concentrate_id);

    expect(text).toBeTypeOf("string");
    expect(text).not.toBe("");
    // The band's whole job on this screen: say why the hero number switched to
    // millilitres, and name the amount to draw into the syringe.
    expect(text).toContain(`${formatMl(row.ml)} mL`);
    expect(text).toContain("seringa");
  });

  it("gives an ordinary row no band at all", () => {
    const result = rowsFor("equilibrada", 1);
    const row = result.rows.find(
      (candidate) => !candidate.high_drop_count && !candidate.covered_by_base,
    )!;

    expect(rowWarningText(result.warnings, row.concentrate_id)).toBeUndefined();
  });
});
