/**
 * StarGlyph (feature: coa-save-recipes) — the single ★ SVG shared by the rating UIs.
 *
 * The star path + its stroke/fill treatment is identical between the read-only rating on
 * `RecipeCard` (role="img" wrapper) and the interactive rating radios on `SaveRecipeForm`
 * (role="radio" wrappers). Only the glyph is shared here; each call site keeps its own
 * semantic wrapper and its own filled/empty color (`text-brand` vs `text-fg-4`, applied to
 * the wrapper so the glyph inherits it via `currentColor`).
 *
 * `filled` toggles the fill between `currentColor` and `none`; the stroke is always
 * `currentColor`, so the color is owned by the parent wrapper, not this glyph.
 */

/** The star outline on the shared 24-grid. Single source of truth for the path literal. */
export const STAR_PATH =
  "M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.5z";

export interface StarGlyphProps {
  /** Rendered width/height in px (16 read-only on the card, 22 interactive in the form). */
  size: number;
  /** When true the star is solid (`fill="currentColor"`); otherwise just the outline. */
  filled: boolean;
  /**
   * Optional class on the `<svg>` itself — RecipeCard sets the filled/empty color here
   * (`text-brand` / `text-fg-4`) since it has no wrapper; SaveRecipeForm leaves it unset
   * and colors the wrapping `<button>` instead.
   */
  className?: string;
}

export function StarGlyph({ size, filled, className }: StarGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={STAR_PATH} />
    </svg>
  );
}
