"use client";

/**
 * LangToggle (RMP-193) — EN / PT switcher with REAL locale routing. Two sizes
 * (ported from coa-shell.jsx):
 *  - `sm` : inline "EN · PT" text toggle (footer).
 *  - `lg` : pill segmented control with the active code on the teal accent (nav).
 *
 * Routes between /en and /pt with next-intl's navigation helpers, preserving the
 * current pathname (the `usePathname` here is locale-aware, so it returns the
 * path WITHOUT the locale prefix; `router.replace({...}, {locale})` re-prefixes
 * it). The active code reflects the URL locale (`useLocale`), not local state —
 * the old 'coa-lang' localStorage toggle is superseded by the routing.
 */
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "../../i18n/navigation";

const CODES = [
  // `name` is the accessible name for each radio — the visible label is just the
  // two-letter code, so screen readers get the full language endonym instead.
  // Endonyms are proper nouns; fine to keep as literals (not translated).
  { locale: "en", code: "EN", name: "English" },
  { locale: "pt", code: "PT", name: "Português (Brasil)" },
] as const;

export function LangToggle({ size = "sm" }: { size?: "sm" | "lg" }) {
  const active = useLocale();
  const t = useTranslations("Shell");
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const big = size === "lg";

  const go = (locale: string) => {
    if (locale === active) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  const item = (locale: string) => ({
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: big ? 14 : 12.5,
    cursor: "pointer",
    padding: big ? "6px 12px" : 0,
    borderRadius: 999,
    color:
      active === locale ? (big ? "#fff" : "var(--fg)") : "var(--fg-3)",
    background: big && active === locale ? "var(--brand)" : "transparent",
    border: "none" as const,
  });

  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: big ? 4 : 6,
        padding: big ? 3 : 0,
        borderRadius: 999,
        background: big ? "var(--bg-2)" : "transparent",
        border: big ? "1px solid var(--border)" : "none",
      }}
    >
      {CODES.map(({ locale, code, name }, i) => (
        <span key={locale} style={{ display: "inline-flex", alignItems: "center" }}>
          <button
            type="button"
            role="radio"
            style={item(locale)}
            aria-checked={active === locale}
            aria-label={name}
            onClick={() => go(locale)}
          >
            {code}
          </button>
          {!big && i === 0 && (
            <span
              aria-hidden="true"
              style={{ color: "var(--fg-4)", fontSize: 12, marginLeft: 6 }}
            >
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
