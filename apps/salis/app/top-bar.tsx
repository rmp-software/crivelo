import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@crivelo/ui/button";
import { cn } from "@crivelo/ui/lib/utils";
import { Icon } from "./icons";

/**
 * The shell moves focus to the screen's `<h1>` on every client navigation (see
 * `AppShell`), so both headings are focusable — and must not paint a ring at the
 * mouse user who caused that navigation. `outline-none` drops the UA ring from
 * the programmatic `:focus`; `:focus-visible` puts it back for the keyboard,
 * which is the one case where a visible ring is information.
 *
 * `outline-solid` is load-bearing, not redundant: in Tailwind v4 `outline-none`
 * sets `--tw-outline-style: none`, and `outline-2` reads its style from that
 * variable — so width and colour alone resolve to `outline-style: none` and
 * NOTHING paints for the keyboard user. Re-asserting the style is what turns
 * the ring back on. Verified in the browser, not read off the class list.
 */
const titleFocus =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * The screen header, in the handoff's two shapes.
 *
 * - **Root tab** (no `backHref`): the 56 px bar, then the large title and its
 *   helper line below it. The bar sticks to the top of the scroll region while
 *   the large title scrolls away under it — the iOS large-title behaviour the
 *   handoff describes, and the reason the bar and the title block are siblings
 *   rather than one box. The bar itself holds only `rightAction`; the brand
 *   lockup lands with the screen that needs it (RMP-253+).
 * - **Pushed screen** (`backHref`): the same 56 px bar with a back control and
 *   the title centred and compact. No large title, and the shell hides the tab
 *   bar.
 *
 * Back is a `Link` to a fixed destination, not `router.back()`. A student
 * reaches a pushed screen from a shared link or a cold standalone launch just
 * as often as from inside the app, and in those cases there is no history entry
 * to pop — so the destination has to be named rather than popped. It is the
 * owning tab, EXCEPT for a screen pushed from another pushed screen, which
 * returns to its parent (S3 modo preparo → S2 the recipe).
 */
export function TopBar({
  title,
  subtitle,
  backHref,
  rightAction,
}: {
  title: string;
  /**
   * The helper line under the title — body text under the large title, mono
   * under the compact one (the handoff's `TopBar.d.ts`: "Compact bar renders it
   * in mono (e.g. 'para 1 L')"). Both shapes render it.
   */
  subtitle?: string;
  /** Set on a pushed screen: where the back control goes — see above. */
  backHref?: string;
  /**
   * Trailing control on the 56 px bar — `Salis ⚙` on a root tab, `⋯` on a
   * pushed screen (see the wireframes in `docs/01-v1-plan.md` § Screens).
   *
   * CENTRING HOLDS ONLY UP TO 44 px. The slot's 44 px is a floor, not a cap,
   * and the back control opposite it is a fixed 44 px — so an action WIDER
   * than that (a two-icon group, say) makes the flex row asymmetric and pulls
   * the centred title left by half the difference. The wireframes only ever
   * show one icon here; put anything more behind a single overflow control
   * rather than widening the slot.
   */
  rightAction?: ReactNode;
}) {
  if (backHref) {
    return (
      <header className="sticky top-0 z-10 flex h-topbar items-center gap-1 bg-bg px-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          // text-fg: the ghost variant sets no colour, and the base stylesheet
          // paints a bare <a> in link blue. The handoff's back control is ink.
          // scale-[.94]: the handoff's IconButton press scale, off Tailwind's
          // scale steps (95 would be nearest-step rounding).
          className="size-tap-min text-fg active:scale-[.94]"
        >
          <Link href={backHref} aria-label="Voltar">
            <Icon name="chevron-left" size={22} />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col items-center">
          {/* 17px/22px: the handoff's compact-bar title size, off the named
              scale (between text-h3 at 18px and text-body at 16px). */}
          <h1
            tabIndex={-1}
            className={cn(
              "max-w-full truncate text-center text-[17px]/[22px] font-semibold text-fg",
              titleFocus,
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-full truncate font-mono text-data-xs text-fg-3">
              {subtitle}
            </p>
          )}
        </div>
        {/* min-w-tap-min mirrors the back control so the title stays centred —
            the handoff's `minWidth: 44`. A floor, not a cap: see rightAction's
            note on why anything wider than 44 px skews the title. */}
        <div className="flex min-w-tap-min shrink-0 justify-end">
          {rightAction}
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex h-topbar items-center justify-end gap-1 bg-bg px-2">
        {rightAction}
      </header>
      <div className="px-gutter pb-3">
        <h1
          tabIndex={-1}
          className={cn("text-h1 font-semibold text-fg", titleFocus)}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-body-sm text-fg-2">{subtitle}</p>}
      </div>
    </>
  );
}
