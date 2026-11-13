/*
 * cn() — the shared class-merging helper for @crivelo/ui primitives and app code.
 *
 * Built on clsx (conditional class composition) + tailwind-merge (last-wins conflict
 * resolution). The default tailwind-merge config only knows Tailwind's stock scales, so
 * it would NOT treat this monorepo's custom @theme tokens as conflicting groups. Two
 * families are registered via extendTailwindMerge so the primitives can override them
 * safely:
 *
 *   1. font-size — the foundation/@theme exposes a custom type scale beyond Tailwind's
 *      stock t-shirt sizes. The new-york primitives ship `text-sm` etc.; callers must be
 *      able to override with `text-[var(--fs-h2)]` or a custom step and win. Registering
 *      the custom steps under the `font-size` group keeps `text-sm text-lg` collapsing to
 *      the last one instead of both surviving.
 *   2. shadow — the foundation defines shadow-1 / shadow-2 / shadow-inset (NOT Tailwind's
 *      stock shadow-sm/md/lg). Without registration tailwind-merge does not know
 *      `shadow-1 shadow-2` conflict, so both would survive. Registered under the
 *      `shadow` group so the last one wins.
 *
 * The stock Tailwind shadow/text utilities the new-york primitives use (shadow-xs,
 * text-sm, …) stay valid — extendTailwindMerge APPENDS our custom values to the existing
 * groups rather than replacing them.
 */
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Custom type scale from @crivelo/tokens foundation (--fs-*). Appended to the
      // built-in `font-size` group so `text-<custom> text-sm` resolves to the last.
      "font-size": [
        // NOTE: `text-caption` below was missing from this list even though it
        // is a Crivelo token (--text-caption in @crivelo/tokens). It was
        // therefore being dropped in apps/crivelo-web's PourSchedule, which
        // writes cn(MONO, "text-caption text-fg-3") — that text has been
        // rendering at the 16px default rather than caption size. Registering
        // it restores what the author wrote; expect that one span to get
        // smaller.
        // @crivelo/tokens (--fs-*)
        "text-display",
        "text-h1",
        "text-h2",
        "text-h3",
        "text-h4",
        "text-body",
        "text-small",
        "text-mono-lg",
        "text-mono",
        // @salis/tokens — Salis replaces the Crivelo house at Tier 1 and brings
        // its own type scale, including the mono "data" scale every quantity in
        // that app renders with. Unregistered, tailwind-merge cannot tell
        // `text-data-sm` IS a font-size, buckets it with whatever colour class
        // follows, and SILENTLY DELETES it — `cn("text-data-sm", "text-fg")`
        // returned just "text-fg", so dose rows rendered at the 16px default
        // instead of their 14px token. A dropped class, not a wrong one, which
        // is why nothing failed and only the pixels showed it.
        "text-body-sm",
        "text-label",
        "text-caption",
        "text-overline",
        "text-data-hero",
        "text-data-xl",
        "text-data-lg",
        "text-data-md",
        "text-data-sm",
        "text-data-xs",
      ],
      // Custom shadow tokens from the foundation (--shadow-1/2/inset) surfaced as
      // shadow-1 / shadow-2 / shadow-inset utilities. Appended to the built-in
      // `shadow` group so the last shadow utility wins.
      shadow: ["shadow-1", "shadow-2", "shadow-inset"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
