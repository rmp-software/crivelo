/**
 * Crivelo family nav config (RMP-190).
 *
 * Single source of truth for the cross-app links shown in the nav sheet + footer.
 * Cross-app URLs are temporary until the domain cutover (crivelo.coffee) — they
 * live here so the later DNS task is a one-file change (see the spec's risks).
 *
 * Family-marker colours: token-backed dots set `markerClass` (a static Tailwind
 * utility, e.g. `"bg-brand"`). The lone external rgb (Crema Arena cinnamon — not
 * a crivelo-web token) uses the `dot` field, rendered as inline
 * `style={{ background }}` in NavSheet/Footer (documented OQ2 exception). Items
 * with neither field fall back to `bg-fg-4` at the render site.
 */

/** The current Crema Arena URL — centralized for the later domain cutover. */
export const CREMA_ARENA_URL = "https://crema-arena.vercel.app";

/** Crema Arena's cinnamon brand colour (its accent, not a crivelo-web token). */
const CREMA_ARENA_DOT = "rgb(192 118 60)";

export interface NavItem {
  /** Proper-noun product name — NEVER translated (Coa, Crema Arena, …). */
  name: string;
  /**
   * Translation key (under the `Nav` namespace) for the short tag shown beside
   * the name in the nav sheet, e.g. "the 4:6 calculator". `soon` items have no
   * tag (the shell renders the localized "soon" badge instead).
   */
  tagKey?: string;
  href?: string;
  /** Opens in a new tab (shows the ↗ glyph). */
  external?: boolean;
  /** The tool you are currently in. */
  current?: boolean;
  /** Not yet shipped — rendered dimmed, non-interactive. */
  soon?: boolean;
  /**
   * External rgb dot colour (CSS string). Use ONLY for non-token external brand
   * colours (e.g. Crema Arena cinnamon). Token-backed dots use `markerClass`.
   */
  dot?: string;
  /**
   * Tailwind utility class for the family-marker dot when the colour is a
   * registered token (e.g. `"bg-brand"`, `"bg-fg-4"`). Rendered directly as a
   * className; takes precedence over the `bg-fg-4` fallback.
   */
  markerClass?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: "Coa",
    tagKey: "coa.tag",
    href: "/",
    current: true,
    markerClass: "bg-brand",
  },
  {
    name: "Crema Arena",
    tagKey: "cremaArena.tag",
    href: CREMA_ARENA_URL,
    external: true,
    dot: CREMA_ARENA_DOT,
  },
  { name: "Léxico", soon: true },
  { name: "Diário", soon: true },
];
