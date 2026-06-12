"use client";

/**
 * Header (RMP-190) — sticky top bar: left hamburger → CoaLockup ("Coa by
 * Crivelo"); nothing on the right. Ported from coa-shell.jsx (the inline
 * CoaMark + wordmark is replaced by the shared CoaLockup brand component).
 *
 * Client component: it triggers the nav-sheet open state owned by Shell.
 */
import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { CoaLockup } from "../brand";
import { Button } from "../ui/Button";
import { Link } from "../../i18n/navigation";

export const Header = forwardRef<HTMLButtonElement, { onMenu: () => void }>(
  function Header({ onMenu }, ref) {
    const t = useTranslations("Shell");
    return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-[color:var(--bg)]",
        "border-b border-[color:var(--border)]",
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
          className="-ml-1 shrink-0 rounded-full text-[color:var(--fg)] hover:bg-transparent hover:text-[color:var(--fg)]"
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
      </div>
    </header>
    );
  },
);
