import type { Concentrate, Recipe } from "@/engine/types";

/**
 * Which concentrate unlocks the most recipes — derived from content, never named
 * in code.
 *
 * S0's last screen becomes "Comece pelo Mg" when the student owns nothing (see
 * `docs/01-v1-plan.md` § User journey). The plan writes "Mg" because magnesium
 * happens to win with the content committed today; hardcoding that would quietly
 * lie the first time Juliana's sheet changes. So the screen asks this function
 * and labels itself from the answer.
 *
 * **"Unlocks the most" = listed by the most recipes.** A recipe is unmakeable
 * until every concentrate in its `concentrate_ids` exists, so the bottle that
 * appears in the most of them is the one that moves the student closest to a
 * first brew.
 *
 * **Ties break on content order, deliberately.** With today's content Mg and Ca
 * are both in all five recipes, and the comparison below is strict `>`, so the
 * first one Juliana's sheet lists wins — which is Mg, which is what the plan's
 * copy says. Her sheet row order is therefore the tiebreak she already controls;
 * an arbitrary rule (alphabetical, cheapest salt) would be ours.
 */
export interface UnlockingConcentrate {
  concentrate: Concentrate;
  /** How many recipes list this concentrate. */
  recipeCount: number;
}

export function findUnlockingConcentrate(
  concentrates: readonly Concentrate[],
  recipes: readonly Pick<Recipe, "concentrate_ids">[],
): UnlockingConcentrate | null {
  let best: UnlockingConcentrate | null = null;
  for (const concentrate of concentrates) {
    const recipeCount = recipes.filter((recipe) =>
      recipe.concentrate_ids.includes(concentrate.id),
    ).length;
    // Strict `>`: see the tiebreak note above.
    if (!best || recipeCount > best.recipeCount) {
      best = { concentrate, recipeCount };
    }
  }
  return best;
}
