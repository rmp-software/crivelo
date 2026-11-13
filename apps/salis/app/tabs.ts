import type { IconName } from "./icons";

/**
 * The three root tabs, in bar order.
 *
 * `href` is both the route and the identity of the tab — there is no separate id
 * to keep in sync with the filesystem, and each tab owns the segment its pushed
 * screens nest under (`/receitas/[recipeId]` belongs to Receitas). That nesting
 * is what gives every tab its own stack: the browser's history is the stack, and
 * a pushed screen can always name the tab it came from.
 *
 * Labels are the course vocabulary (Receitas, Concentrados, Aprender) and carry
 * no period, per the voice rules in apps/salis/CLAUDE.md.
 */
export const TABS = [
  { href: "/receitas", label: "Receitas", icon: "droplets" },
  { href: "/concentrados", label: "Concentrados", icon: "flask-conical" },
  { href: "/aprender", label: "Aprender", icon: "graduation-cap" },
] as const satisfies readonly { href: string; label: string; icon: IconName }[];

/**
 * Whether `pathname` is a root tab — which is the same question as "show the tab
 * bar?".
 *
 * The rule is positional, not per-screen: a root tab is EXACTLY one of the three
 * tab paths, so every pushed screen hides the bar without passing a flag and
 * without a new screen having to remember to set one. A path that merely starts
 * like a tab (`/receitas-antigas`) is not a tab.
 */
export function isRootTabPath(pathname: string): boolean {
  return TABS.some((tab) => tab.href === pathname);
}
