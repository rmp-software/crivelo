/**
 * Crivelo family nav config (RMP-190).
 *
 * Single source of truth for the cross-app links shown in the nav sheet + footer.
 * Cross-app URLs are temporary until the domain cutover (crivelo.coffee) — they
 * live here so the later DNS task is a one-file change (see the spec's risks).
 *
 * `dot` is a CSS colour for the family marker: Coa uses the site teal accent
 * (`var(--brand)`); Crema Arena carries its own cinnamon brand colour, which is
 * not a token in this app, so it lives here as the canonical brand hex (data, not
 * a styling decision).
 */

/** The current Crema Arena URL — centralized for the later domain cutover. */
export const CREMA_ARENA_URL = "https://crema-arena.vercel.app";

/** Crema Arena's cinnamon brand colour (its accent, not a crivelo-web token). */
const CREMA_ARENA_DOT = "#C0763C";

export interface NavItem {
  name: string;
  /** Short tag shown beside the name in the nav sheet. */
  tag: string;
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
    tag: "the 4:6 calculator",
    href: "/",
    current: true,
    dot: "var(--brand)",
  },
  {
    name: "Crema Arena",
    tag: "open in new tab",
    href: CREMA_ARENA_URL,
    external: true,
    dot: CREMA_ARENA_DOT,
  },
  { name: "Léxico", tag: "soon", soon: true },
  { name: "Diário", tag: "soon", soon: true },
];
