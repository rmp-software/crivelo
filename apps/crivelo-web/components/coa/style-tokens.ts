/**
 * Coa — shared className constants for the recipe surfaces (feature:
 * coa-save-recipes).
 *
 * These class strings are verbatim-shared across the home calculator
 * (`CoaCalculator`), the last-brew card (`LastBrewCard`), and the `/recipes`
 * list (`RecipeCard`), so they live here as a single source of truth rather than
 * being re-declared per file. Pure constants — no React, no runtime.
 */

/** Section caption — uppercase micro-label matching the calculator captions. */
export const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

/** Tabular mono numerals — keeps values from jittering as digits change. */
export const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

/**
 * The two card action pills (44px), verbatim-shared between LastBrewCard and RecipeCard:
 *  - `CARD_PILL_SOLID`   — the brand-filled primary ("Brew again", carries a leading icon),
 *  - `CARD_PILL_OUTLINE` — the bordered secondary ("Edit").
 * These are the in-card pills only; SaveRecipeForm's 54px form CTAs are a different size/context.
 */
export const CARD_PILL_SOLID =
  "flex h-11 flex-1 gap-2 rounded-md border-none bg-brand p-0 font-body text-small font-semibold whitespace-normal text-white shadow-1 hover:bg-brand has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-4";
export const CARD_PILL_OUTLINE =
  "flex h-11 flex-1 rounded-md border border-border-strong bg-transparent p-0 font-body text-small font-semibold whitespace-normal text-fg shadow-none hover:bg-transparent hover:text-fg";
