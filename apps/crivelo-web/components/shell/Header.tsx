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
import { CoaLockup } from "../brand";
import { Button } from "../ui/Button";
import { Link } from "../../i18n/navigation";

export const Header = forwardRef<HTMLButtonElement, { onMenu: () => void }>(
  function Header({ onMenu }, ref) {
    const t = useTranslations("Shell");
    return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1060,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 16px",
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
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
          style={{ textDecoration: "none", display: "inline-flex" }}
        >
          <CoaLockup size="sm" />
        </Link>
      </div>
    </header>
    );
  },
);
