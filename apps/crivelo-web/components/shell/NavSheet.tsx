"use client";

/**
 * NavSheet (RMP-190, migrated to the shared Sheet in RMP-206a) — the family nav,
 * sliding from the LEFT behind a scrim.
 *
 * The drawer MECHANISM (left-slide panel, scrim/overlay, focus trap, Escape-to-
 * close, overlay-click-to-close, body-scroll-lock) now rides the shared
 * `@crivelo/ui/sheet` primitive (Radix Dialog under the hood) — the hand-rolled
 * fixed/translateX/inert/role=dialog markup is gone. The CONTENT is unchanged:
 * CriveloLockup + tagline lead, "The house" lists the family (Coa = you-are-here
 * teal dot, Crema Arena external ↗, Léxico/Diário soon), and the bottom holds the
 * Language + Appearance controls. The reference's `var(--coa-ink)` (teal text)
 * maps to this site's `var(--accent-ink)`. Family links + URLs come from NAV_ITEMS.
 *
 * Styling: the foundation's neutral semantic tokens (--fg/--fg-2/3/4, --border,
 * --font-display/--font-serif, …) are used via bare token utilities (`text-fg-2`,
 * `bg-bg`, `border-border`, etc.) — NOT inline `style` and NOT `[var(--…)]`
 * arbitraries. The Sheet panel/overlay/close-button are themed by the shared
 * shadcn alias layer (bg-background/border/…).
 */
import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@crivelo/ui/sheet";
import { cn } from "@crivelo/ui/lib/utils";
import { CriveloLockup } from "../brand";
import { Icon } from "../coa/icons";
import { Link } from "../../i18n/navigation";
import { NAV_ITEMS } from "./nav";
import { LangToggle } from "./LangToggle";
import { ThemeControl } from "./ThemeControl";

/** Section caption ("THE HOUSE" / "LANGUAGE" / "APPEARANCE"). */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

export function NavSheet({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * The hamburger button focus should return to when the sheet closes. Because
   * this is a controlled Sheet with NO SheetTrigger, Radix's triggerRef is null
   * and can't auto-return focus — so we thread the trigger element in and steer
   * Radix's onCloseAutoFocus to it (fires AFTER the close animation, no race).
   */
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("Shell");
  const tNav = useTranslations("Nav");

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="left"
        // The custom circular close button below replaces the primitive's
        // default top-right X (which mismatched the legacy affordance and could
        // overlap the lockup), so suppress it.
        showCloseButton={false}
        // Return focus to the hamburger AFTER the close animation completes
        // (Radix fires this on close); preventDefault stops Radix's null-trigger
        // fallback from focusing the body. Replaces Shell's old state-time
        // focus() call that raced the 300ms close animation.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocusRef?.current?.focus();
        }}
        // The accessible name comes from the sr-only SheetTitle below; the legacy
        // dialog carried no description, so opt out of Radix's description warning.
        aria-describedby={undefined}
        className="z-[60] w-[84%] max-w-[340px] gap-0 overflow-y-auto bg-bg px-[22px] pt-[22px] pb-[26px] shadow-2"
      >
        <SheetHeader className="mb-[22px] flex-row items-start justify-between gap-0 p-0">
          <CriveloLockup size="md" />
          <SheetTitle className="sr-only">{t("siteMenu")}</SheetTitle>
          {/* Custom close: a SheetClose (Radix Close → onOpenChange → onClose)
              restoring the legacy 36×36 circular X affordance (1px --border ring
              on --surface-raised). `-mt-1` nudges it up to align with the lockup
              cap-height without overlapping it. */}
          <SheetClose
            aria-label={t("closeMenu")}
            className={cn(
              "-mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              "border border-border bg-surface-raised",
              "text-fg cursor-pointer transition-opacity hover:opacity-80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </SheetClose>
        </SheetHeader>

        <p className="mb-5 font-serif text-h4 italic leading-[1.35] text-fg-2">
          {t("tagline")}
        </p>

        <div className={cn(CAP, "mb-2")}>{t("theHouse")}</div>
        <nav className="flex flex-col">
          {NAV_ITEMS.map((it) => {
            const rowClass = cn(
              "flex items-center gap-3 py-[13px] no-underline border-b border-border",
              it.soon
                ? "text-fg-4 cursor-default"
                : "text-fg cursor-pointer",
            );
            // The family-marker colour is per-item DATA from NAV_ITEMS:
            // - Token-backed dots use className utilities (bg-brand, bg-fg-4).
            // - The lone external rgb (Crema Arena cinnamon — not a crivelo-web
            //   token) uses inline style={{ background }} as the documented OQ2
            //   exception. The `--dot` custom-property bridge is removed.
            const inner = (
              <>
                {/* Dot: token dots → className utility; external rgb → inline style (OQ2). */}
                <span
                  className={cn(
                    "h-[9px] w-[9px] shrink-0 rounded-full",
                    !it.dot && (it.markerClass ?? "bg-fg-4"),
                    it.soon && "opacity-50",
                  )}
                  style={it.dot ? { background: it.dot } : undefined}
                />
                <span className="flex-1">
                  <span className="font-display text-h4 font-bold tracking-[-0.01em]">
                    {it.name}
                  </span>
                  {it.current && (
                    <span className="ml-2 text-[11px] font-semibold text-accent-ink">
                      · {t("youAreHere")}
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-[5px] text-[12.5px] text-fg-3">
                  {it.soon ? t("soon") : it.tagKey ? tNav(it.tagKey) : null}
                  {it.external && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  )}
                </span>
              </>
            );
            if (it.soon || !it.href) {
              return (
                <div key={it.name} className={rowClass}>
                  {inner}
                </div>
              );
            }
            // External links keep a plain anchor (other apps / new tab);
            // internal links use the locale-aware Link so the active locale
            // prefix is preserved.
            return it.external ? (
              <a
                key={it.name}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className={rowClass}
              >
                {inner}
              </a>
            ) : (
              <Link
                key={it.name}
                href={it.href}
                onClick={it.current ? onClose : undefined}
                className={rowClass}
              >
                {inner}
              </Link>
            );
          })}
          {/* Saved recipes — an app page of Coa, not a family product, so it's a
              dedicated row here rather than a NAV_ITEMS entry (the footer also
              consumes NAV_ITEMS). The bookmark glyph matches the header's
              affordance; onClose because it's an in-app navigation (the shell
              doesn't remount). */}
          <Link
            href="/recipes"
            onClick={onClose}
            className="flex cursor-pointer items-center gap-3 border-b border-border py-[13px] text-fg no-underline"
          >
            <span className="flex w-[9px] shrink-0 justify-center text-fg-3">
              <Icon name="bookmark" size={17} stroke={1.7} />
            </span>
            <span className="flex-1 font-display text-h4 font-bold tracking-[-0.01em]">
              {t("savedRecipes")}
            </span>
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-[18px] pt-[26px]">
          <div>
            <div className={cn(CAP, "mb-2.5")}>{t("language")}</div>
            <LangToggle size="lg" />
          </div>
          <div>
            <div className={cn(CAP, "mb-2.5")}>{t("appearance")}</div>
            <ThemeControl />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
