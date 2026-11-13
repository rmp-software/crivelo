import { describe, expect, it } from "vitest";
import type { Concentrate } from "@/engine/types";
import { content } from "../../content";
import { findUnlockingConcentrate } from "../unlocking-concentrate";

/**
 * The node environment is enough: the function is pure and the only fixture it
 * needs beyond synthetic ids is the committed content itself.
 */

/** A concentrate stub — only `id` is read, the rest satisfies the type. */
function stub(id: string): Concentrate {
  return {
    id,
    mineral_id: `${id}-mineral`,
    label_pt: id,
    salt_g: 1,
    water_ml: 250,
    shelf_life_days: 90,
    storage_note: "",
    steps_pt: "",
    ion: "Mg",
    ion_mg_per_ml: 1,
  };
}

describe("findUnlockingConcentrate", () => {
  it("picks the concentrate the most recipes list", () => {
    const result = findUnlockingConcentrate(
      [stub("a"), stub("b"), stub("c")],
      [
        { concentrate_ids: ["a", "b"] },
        { concentrate_ids: ["b", "c"] },
        { concentrate_ids: ["b"] },
      ],
    );
    expect(result).toEqual({ concentrate: stub("b"), recipeCount: 3 });
  });

  it("breaks a tie on content order, so Juliana's sheet decides", () => {
    const result = findUnlockingConcentrate(
      [stub("first"), stub("second")],
      [{ concentrate_ids: ["first", "second"] }],
    );
    expect(result?.concentrate.id).toBe("first");
  });

  it("returns null when there are no concentrates", () => {
    expect(findUnlockingConcentrate([], [{ concentrate_ids: ["a"] }])).toBeNull();
  });

  it("counts a concentrate no recipe uses as zero rather than skipping it", () => {
    const result = findUnlockingConcentrate([stub("unused")], []);
    expect(result).toEqual({ concentrate: stub("unused"), recipeCount: 0 });
  });

  /**
   * The guard on the plan's copy: S0's empty-grid screen reads "Comece pelo Mg"
   * only because the committed content makes magnesium win. If a content import
   * ever changes that, this fails and the copy follows the data instead of
   * silently going stale.
   */
  it("resolves to magnesium with the content committed today", () => {
    const result = findUnlockingConcentrate(
      content.concentrates,
      content.recipes,
    );
    expect(result?.concentrate.id).toBe("mg-30k");
    expect(result?.concentrate.ion).toBe("Mg");
    expect(result?.recipeCount).toBe(content.recipes.length);
  });
});
