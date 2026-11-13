/**
 * How many of a recipe's concentrates the student does not have yet.
 *
 * The one piece of arithmetic on S1, and the reason it lives in its own module:
 * the screen's test ("with 1 of 3 concentrates owned, a card reads `falta 2`")
 * is about this function, not about React, so it can be asserted in the node
 * test environment the app already runs (`vitest.config.ts` is node-only, no
 * jsdom — see its header).
 *
 * A Set, not `includes`, because the caller runs this once per recipe against
 * the same inventory: `includes` would make the screen O(recipes × owned).
 * Irrelevant at five recipes; free to get right.
 */
export function countMissing(
  concentrateIds: readonly string[],
  ownedIds: readonly string[],
): number {
  const owned = new Set(ownedIds);
  return concentrateIds.filter((id) => !owned.has(id)).length;
}
