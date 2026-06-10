"use client";

/**
 * NavSheet (RMP-190) — the family nav, sliding from the LEFT behind a scrim.
 *
 * Ported faithfully from coa-shell.jsx: CriveloLockup + tagline lead, "The house"
 * lists the family (Coa = you-are-here teal dot, Crema Arena external ↗,
 * Léxico/Diário soon), and the bottom holds the Language + Appearance controls.
 * The reference's `var(--coa-ink)` (teal text) maps to this site's
 * `var(--accent-ink)`. Family links + URLs come from the centralized NAV_ITEMS.
 */
import { useEffect, useRef, type HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { CriveloLockup } from "../brand";
import { Link } from "../../i18n/navigation";
import { NAV_ITEMS } from "./nav";
import { LangToggle } from "./LangToggle";
import { ThemeControl } from "./ThemeControl";

const CAP = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  fontWeight: 600,
  color: "var(--fg-3)",
};

export function NavSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Shell");
  const tNav = useTranslations("Nav");
  const closeRef = useRef<HTMLButtonElement>(null);

  // `inert` when closed: hides the subtree from AT *and* removes its children
  // from the tab order, and — unlike aria-hidden — never trips the
  // "Blocked aria-hidden … descendant retained focus" warning. The empty-string
  // value is what React 18 writes to the DOM cleanly (a boolean `inert` trips
  // React 18's "non-boolean attribute" warning); absent entirely when open.
  // Cast localizes the @types/react-18 boolean-typing mismatch to this one prop.
  const inertProps = (
    open ? {} : { inert: "" }
  ) as HTMLAttributes<HTMLDivElement>;

  // On open, move focus to the Close button so keyboard/AT users land inside the
  // dialog. (Return-of-focus to the hamburger is owned by Shell.)
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    // `inert` (not aria-hidden) when closed: it both hides the subtree from AT
    // and removes its children from the tab order, and — unlike aria-hidden —
    // never trips the "Blocked aria-hidden … descendant retained focus" warning.
    <div
      {...inertProps}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* scrim */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(31,20,16,0.55)",
          opacity: open ? 1 : 0,
          transition: "opacity var(--dur-stage) var(--ease-standard)",
        }}
      />
      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("siteMenu")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "84%",
          maxWidth: 340,
          background: "var(--bg)",
          boxShadow: "var(--shadow-2)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform var(--dur-stage) var(--ease-standard)",
          display: "flex",
          flexDirection: "column",
          padding: "22px 22px 26px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <CriveloLockup size="md" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            style={{
              width: 36,
              height: 36,
              marginTop: -4,
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--surface-raised)",
              color: "var(--fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
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
          </button>
        </div>

        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 17,
            color: "var(--fg-2)",
            margin: "0 0 20px",
            lineHeight: 1.35,
          }}
        >
          {t("tagline")}
        </p>

        <div style={{ ...CAP, marginBottom: 8 }}>{t("theHouse")}</div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {NAV_ITEMS.map((it) => {
            const base = {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 0",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
              color: it.soon ? "var(--fg-4)" : "var(--fg)",
              cursor: it.soon ? "default" : "pointer",
            } as const;
            const inner = (
              <>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: it.dot || "var(--fg-4)",
                    opacity: it.soon ? 0.5 : 1,
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {it.name}
                  </span>
                  {it.current && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--accent-ink)",
                      }}
                    >
                      · {t("youAreHere")}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: "var(--fg-3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
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
                <div key={it.name} style={base}>
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
                style={base}
              >
                {inner}
              </a>
            ) : (
              <Link
                key={it.name}
                href={it.href}
                onClick={it.current ? onClose : undefined}
                style={base}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <div style={{ ...CAP, marginBottom: 10 }}>{t("language")}</div>
            <LangToggle size="lg" />
          </div>
          <div>
            <div style={{ ...CAP, marginBottom: 10 }}>{t("appearance")}</div>
            <ThemeControl />
          </div>
        </div>
      </aside>
    </div>
  );
}
