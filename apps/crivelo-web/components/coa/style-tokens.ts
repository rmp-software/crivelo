/**
 * Coa — shared className constants for the recipe surfaces (feature:
 * coa-save-recipes).
 *
 * These two class strings are verbatim-shared across the home calculator
 * (`CoaCalculator`), the last-brew card (`LastBrewCard`), and the upcoming
 * `/recipes` list, so they live here as a single source of truth rather than
 * being re-declared per file. Pure constants — no React, no runtime.
 */

/** Section caption — uppercase micro-label matching the calculator captions. */
export const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

/** Tabular mono numerals — keeps values from jittering as digits change. */
export const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";
