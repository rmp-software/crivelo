"use client";

/**
 * Header (RMP-190) — sticky top bar: left hamburger → CoaLockup ("Coa by
 * Crivelo"); a right-side "Saved recipes" bookmark (feature: coa-save-recipes).
 * Ported from coa-shell.jsx (the inline CoaMark + wordmark is replaced by the
 * shared CoaLockup brand component).
 *
 * Client component: it triggers the nav-sheet open state owned by Shell, and the
 * bookmark reads the saved-recipe count from `localStorage` post-mount.
 *
 * Saved-recipes bookmark (replaces the old in-flow "Saved recipes →" link):
 *  - **Persistent navigation affordance** to `/[locale]/recipes`, present even in
 *    the empty state (where the old in-flow link vanished with the last-brew card).
 *  - **Count badge** when `getRecipes().length > 0`. The count lives in
 *    `localStorage` (null on the server) so it's read in an effect behind a
 *    `mounted` flag: server + first client paint render no badge (matching markup
 *    → no hydration mismatch), then the badge appears on the post-mount commit.
 *  - **Scoped out of the immersive `/brew` timer** (the running brew is a focused,
 *    chrome-light flow). Shown on home + `/recipes` and any other route. The
 *    locale-stripped `usePathname()` is matched against `/brew` so the scope holds
 *    across locales.
 */
import { useEffect, useState, type Ref } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { CoaLockup } from "../brand";
import { Button } from "../ui/Button";
import { Link, usePathname } from "../../i18n/navigation";
import { Icon } from "../coa/icons";
import { getRecipes, subscribeRecipes } from "../../lib/recipes-store";

export function Header({
  onMenu,
  ref,
}: {
  onMenu: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  const t = useTranslations("Shell");
  const pathname = usePathname();

  // Saved-recipe count lives in localStorage (null on the server). Read it after
  // mount so server + first client paint agree (no badge) — no hydration mismatch
  // — then reveal the badge on the post-mount commit.
  //
  // The Shell/Header mounts once in the locale layout and does NOT remount on
  // client-side navigation, so a one-shot mount read would freeze the badge for
  // the whole session. Subscribe instead and re-read on every saved-recipe change
  // — both same-window writes (save on a done screen, delete on /recipes) and
  // cross-tab — so the badge stays live. `subscribeRecipes` returns a no-op
  // unsubscribe off-DOM, and the read itself is SSR-safe (getRecipes() → []).
  const [count, setCount] = useState(0);
  useEffect(() => {
    const read = () => setCount(getRecipes().length);
    read();
    return subscribeRecipes(read);
  }, []);

  // Hide the bookmark on the immersive /brew timer; show it everywhere else
  // (home, /recipes, …). usePathname() is locale-stripped, so `/brew` matches
  // across /en and /pt.
  const showBookmark = !pathname.startsWith("/brew");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-bg",
        "border-b border-border",
      )}
    >
      <div
        className={cn(
          "mx-auto box-border flex h-[66px] max-w-[1060px] items-center gap-3 px-4",
        )}
      >
        <Button
          ref={ref}
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={onMenu}
          aria-label={t("openMenu")}
          className="-ml-1 shrink-0 rounded-full text-fg hover:bg-transparent hover:text-fg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Button>
        <Link
          href="/"
          aria-label={t("homeAria")}
          className="inline-flex no-underline"
        >
          <CoaLockup size="sm" />
        </Link>
        {showBookmark && (
          <Link
            href="/recipes"
            // The accessible name carries the live count (ICU plural); with no
            // saved recipes it's just the plain label.
            aria-label={
              count > 0 ? t("savedRecipesWithCount", { count }) : t("savedRecipes")
            }
            className="relative ml-auto inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised text-fg-2 no-underline transition-colors hover:border-border-strong hover:text-fg md:w-auto md:px-3"
          >
            <Icon name="bookmark" size={19} stroke={1.7} />
            {/* Visual-only text label on md+ (icon-only stays on mobile);
                aria-hidden because aria-label above is the accessible name. */}
            <span aria-hidden="true" className="hidden text-small font-medium md:inline">
              {t("savedRecipes")}
            </span>
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 box-content flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-bg bg-brand px-1 text-[10px] font-semibold leading-none text-white tabular-nums"
              >
                {count}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
