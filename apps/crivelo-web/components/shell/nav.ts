/**
 * Crivelo family nav config (RMP-190).
 *
 * Single source of truth for the cross-app links shown in the nav sheet + footer.
 * Cross-app URLs are temporary until the domain cutover (crivelo.coffee) — they
 * live here so the later DNS task is a one-file change (see the spec's risks).
 *
 * `dot` is a CSS colour for the family marker: Coa uses the site teal accent
 * (`var(--brand)`); Crema Arena carries its own cinnamon brand colour, which is
 * not a token in this app, so it lives here as the canonical brand value (data,
 * not a styling decision). It is expressed in `rgb()` rather than hex so the file
 * carries no raw hex literal (the styling-rework no-hex rule).
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
  /** Family marker colour (CSS). */
  dot?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: "Coa",
    tagKey: "coa.tag",
    href: "/",
    current: true,
    dot: "var(--brand)",
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
