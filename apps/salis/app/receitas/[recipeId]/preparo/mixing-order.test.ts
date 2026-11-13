import { describe, expect, it } from "vitest";
import { computeRecipe } from "@/engine/dosing";
import { content } from "../../../content";

/**
 * S3 enforces the mixing order as TILE ORDER, and the tiles are
 * `computeRecipe(...).rows` in sequence — `prep-mode.tsx` does not sort and
 * does not name a salt. So "bicarbonate last" is a claim about the DATA, and
 * this is where it is checked: against Juliana's committed content, every
 * recipe, not against a literal array typed into a component.
 *
 * The invariant's real home is `scripts/import-content.ts`, which REJECTS a
 * recipe whose HCO₃ concentrate is not last in `concentrate_ids` — content is
 * where it belongs, and a check there fires before a wrong order can be
 * committed at all. This is the second line of defence: it fails if a
 * `content.json` ever reaches the repo past that gate, which is exactly the day
 * S3 would start teaching the wrong order while still looking right.
 */
describe("mixing order", () => {
  const baseWater =
    content.base_waters.find((water) => water.id === "destilada") ??
    content.base_waters[0];

  const rowsFor = (recipeId: string) =>
    computeRecipe({
      recipe: content.recipes.find((recipe) => recipe.id === recipeId)!,
      baseWater,
      concentrates: content.concentrates,
      minerals: content.minerals,
      guards: content.guards,
      drops_per_ml: content.guards.default_drops_per_ml,
      volume_l: 1,
    }).rows;

  it("has recipes to check at all", () => {
    expect(content.recipes.length).toBeGreaterThan(0);
  });

  it.each(content.recipes.map((recipe) => recipe.id))(
    "puts the bicarbonate last in %s",
    (recipeId) => {
      const rows = rowsFor(recipeId);
      expect(rows.length).toBeGreaterThan(0);

      // At most one bicarbonate row, and where there is one it is the last.
      // Both halves matter: "the last row is HCO3" alone would still pass with
      // a second bicarbonate sitting in the middle.
      //
      // At MOST, not exactly one. A recipe with `target_HCO3 = 0` has no
      // bicarbonate stage and is perfectly legitimate content; demanding one
      // here would turn a valid edit to Juliana's sheet into a red UI test.
      const bicarbIndexes = rows
        .map((row, index) => (row.ion === "HCO3" ? index : -1))
        .filter((index) => index >= 0);

      expect(bicarbIndexes.length).toBeLessThanOrEqual(1);
      if (bicarbIndexes.length === 1) {
        expect(bicarbIndexes[0]).toBe(rows.length - 1);
      }
    },
  );
});
