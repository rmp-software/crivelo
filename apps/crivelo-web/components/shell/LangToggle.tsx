"use client";

/**
 * LangToggle (RMP-193 · rebuilt RMP-211) — EN / PT switcher with REAL locale
 * routing. Two sizes (ported from coa-shell.jsx):
 *  - `sm` : inline "EN · PT" text toggle (footer) — accessible buttons styled
 *           with utilities + a `·` separator (not a ToggleGroup: it's a compact
 *           inline text toggle with no pill chrome).
 *  - `lg` : pill segmented control on a `@crivelo/ui` ToggleGroup, active code on
 *           the teal accent (`bg-brand`).
 *
 * Routes between /en and /pt with next-intl's navigation helpers, preserving the
 * current pathname (the `usePathname` here is locale-aware, so it returns the
 * path WITHOUT the locale prefix; `router.replace({...}, {locale})` re-prefixes
 * it). The active code reflects the URL locale (`useLocale`), not local state —
 * the old 'coa-lang' localStorage toggle is superseded by the routing.
 *
 * a11y: the `lg` variant relies on ToggleGroup's native radiogroup semantics
 * (radix ToggleGroup type="single" → role="radiogroup" + role="radio" items);
 * we keep the `t("language")` label on the group and a per-item endonym label.
 */
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@crivelo/ui/toggle-group";
import { cn } from "@crivelo/ui/lib/utils";
import { usePathname, useRouter } from "../../i18n/navigation";

const CODES = [
  // `name` is the accessible name for each option — the visible label is just the
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

  const go = (locale: string) => {
    if (!locale || locale === active) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  if (size === "lg") {
    return (
      <ToggleGroup
        type="single"
        value={active}
        onValueChange={go}
        aria-label={t("language")}
        className="inline-flex items-center gap-1 p-[3px] rounded-full bg-bg-2 border border-border"
      >
        {CODES.map(({ locale, code, name }) => (
          <ToggleGroupItem
            key={locale}
            value={locale}
            aria-label={name}
            className="h-auto min-w-0 flex-none px-3 py-1.5 rounded-full font-body font-semibold text-small text-fg-3 first:rounded-full last:rounded-full hover:bg-transparent hover:text-fg-3 data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:hover:bg-brand data-[state=on]:hover:text-white"
          >
            {code}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <div role="radiogroup" aria-label={t("language")} className="inline-flex items-center gap-1.5">
      {CODES.map(({ locale, code, name }, i) => (
        <span key={locale} className="inline-flex items-center">
          <button
            type="button"
            role="radio"
            aria-checked={active === locale}
            aria-label={name}
            onClick={() => go(locale)}
            className={cn(
              "cursor-pointer font-body font-semibold text-[12.5px]",
              active === locale ? "text-fg" : "text-fg-3",
            )}
          >
            {code}
          </button>
          {i === 0 && (
            <span aria-hidden="true" className="text-fg-4 text-[12px] ml-1.5">
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
