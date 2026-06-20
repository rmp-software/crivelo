/**
 * Coa — shared params-summary formatting (feature: coa-save-recipes).
 *
 * One source of truth for the short, human-readable summary of a {@link RecipeParams}.
 * It is reused across the feature: the done-screen "Save recipe" form seeds the name
 * input with the dose/ratio summary, and the home last-brew card + saved-recipes list
 * (later tasks) render the same string. Putting it here keeps every surface in lockstep
 * instead of each re-deriving "20 g · 1:15" slightly differently.
 *
 * Pure, no React, no i18n: the dose/ratio half is language-agnostic (digits + a fixed
 * `g`/`1:` glyph shape that reads identically in pt-BR and English, matching the
 * calculator's existing `doseRatioSummary` copy `"{dose} g · 1:{ratio}"`). The taste
 * descriptor is localized — callers that want it append the translated `tasteKey(...)`
 * label themselves (the engine stays language-agnostic; UI resolves the key via
 * next-intl), so this module never hardcodes a taste word.
 */
import type { RecipeParams } from "./recipes-store";

/** Middle dot + surrounding spaces — the separator the calculator copy already uses. */
const SEP = " · ";

/**
 * The dose/ratio half of a params summary, e.g. `"20 g · 1:15"`. This is the default
 * the Save-recipe name input is seeded with. Language-agnostic (no taste word), so it
 * is safe to use as a stored/default name without a locale.
 */
export function doseRatioSummary(params: RecipeParams): string {
  return `${params.dose} g${SEP}1:${params.ratio}`;
}

/**
 * The full summary with a (caller-localized) taste descriptor appended, e.g.
 * `"20 g · 1:15 · balanced"`. The taste label is passed in already-translated (resolve
 * `tasteKey(params.acidity)` through next-intl at the call site) so this stays pure and
 * locale-free. A blank/omitted taste falls back to just the dose/ratio half.
 */
export function paramsSummary(params: RecipeParams, taste?: string): string {
  const base = doseRatioSummary(params);
  return taste && taste.trim() !== "" ? `${base}${SEP}${taste}` : base;
}
