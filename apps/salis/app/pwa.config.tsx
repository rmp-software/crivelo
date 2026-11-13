import type { PwaConfig } from "@crivelo/pwa";

/**
 * Salis PWA config — the single source of truth for the manifest, the icon
 * tiles and the iOS splash. Consumed by app/manifest.ts, app/icon.tsx,
 * app/apple-icon.tsx, app/pwa-icon/[variant]/route.tsx and
 * app/pwa-splash/[size]/route.tsx.
 *
 * Colours are literal hex, NOT `var(--…)`: next/og's Satori cannot resolve CSS
 * variables, and the manifest's `theme_color`/`background_color` are read by the
 * OS, which has no stylesheet either. Each literal names the `@salis/tokens`
 * variable it mirrors — if a token moves, these move with it.
 */

/**
 * The Salis mark: the drop with a diamond aperture, verbatim from
 * `@salis/tokens/assets/salis-mark-drop-white.svg` (same `d`, same
 * `fill-rule="evenodd"` — the rule is what punches the diamond out of the drop).
 *
 * Inlined rather than imported because Satori renders React elements, not SVG
 * files, and the mark has to carry a concrete `color`. The brand assets stay the
 * authority on the geometry: this path is copied, never redrawn.
 *
 * The asset's viewBox is the tight `8 2 32 43` crop around the glyph, kept here
 * so the drop fills its box the way the brand files draw it.
 */
function SalisDrop({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="8 2 32 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 3C19.5 10.5 9.5 19.5 9.5 29.5A14.5 14.5 0 0 0 38.5 29.5C38.5 19.5 28.5 10.5 24 3ZM24 22.1L31.4 29.5L24 36.9L16.6 29.5Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
}

export const salisPwa: PwaConfig = {
  name: "Salis",
  description: "Água mineralizada para café especial, em gotas.",
  lang: "pt-BR",
  // Default "/" start_url, and that is correct here: Salis is single-locale with
  // no locale segment, so "/" is a real route AND is precached by the offline SW
  // (see @crivelo/pwa's `locales: []` convention). crivelo-web has to override
  // this only because its "/" is a middleware redirect that never runs offline.

  /**
   * THEME COLOUR — the one static value, and Salis has a full dark theme.
   *
   * Picked as the brand teal, not a `--bg` neutral, because `theme_color` has to
   * serve two consumers at once and only one of them is themeable:
   *  - it tints the installed app's OS chrome (Android title bar / task
   *    switcher), which is static — it cannot follow `[data-theme]`;
   *  - `renderIcon` paints it as the icon-tile field, and the brand's own
   *    `assets/app-icon.svg` is `#0F5452` with the white drop. A `--bg` value
   *    would make the tile a near-white square with a white glyph on it.
   * Teal reads as Salis in both themes (it is `--brand` in light and the field
   * the dark theme's `--teal-300` brand is derived from), whereas either `--bg`
   * would be visibly wrong in the other theme. Matches `--teal-700`.
   */
  themeColor: "#0F5452",
  // The splash field BEHIND the icon while the app launches. `--bg` in light
  // (--slate-25), the theme Salis ships in today: dark is defined in
  // @salis/tokens but nothing sets [data-theme="dark"] yet, so light is what a
  // student sees. Revisit together with the dark-theme toggle.
  backgroundColor: "#f6f9f9",
  mark: ({ size, color }) => <SalisDrop size={size} color={color} />,
  // White drop on the teal tile — `assets/salis-mark-drop-white.svg`, which is
  // also what app-icon.svg composites. (The default, stated for the record.)
  markColor: "#ffffff",
  // 0.62 reproduces `assets/app-icon.svg`'s lockup exactly, rather than being
  // eyeballed. That file scales the drop by 0.6921 about the tile centre in
  // 48-unit space, where the glyph is 41 units tall → 0.591 of the tile. Here
  // the mark is an `8 2 32 43` viewBox fitted (meet) into an `iconScale` square,
  // so the drop's height is 41/43 of that square: 0.62 × 41/43 = 0.591. Same
  // drop, same size.
  //
  // Maskable safe zone: the glyph's furthest ink from the tile centre is the
  // drop's tip/base, 20.5 viewBox units out → 20.5 × 0.62/43 = 0.296 of the
  // tile. The platform mask keeps the central 40% radius, so there is room to
  // spare. Larger than the 0.54 default only because the asset's viewBox is
  // already cropped tight to the glyph.
  iconScale: 0.62,
  // app-icon.svg's rx is 10.8 on a 48 tile = 0.225. Salis's radius ramp is
  // "modest, precise" (see packages/salis-tokens/CLAUDE.md), so the tile is
  // squarer than the 0.29 default.
  radiusScale: 0.225,
};
