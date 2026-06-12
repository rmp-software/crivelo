"use client";

/**
 * Footer (RMP-190) — CriveloLockup + tagline + sieve motif (SieveGrid fill mode)
 * + "The family" list + copyright + language toggle. Ported from coa-shell.jsx;
 * uses the centralized NAV_ITEMS. Client component because it embeds LangToggle.
 *
 * Styling (RMP-212): the foundation's neutral semantic tokens are used via bare
 * token utilities (`text-fg-3`, `bg-bg-2`, `border-border`, etc.) — NOT inline
 * `style` and NOT `[var(--…)]` arbitraries. Per-item DATA colours from NAV_ITEMS:
 * token-backed dots use className utilities (markerClass / bg-fg-4); the lone
 * external rgb (Crema Arena cinnamon) uses inline style={{ background }} as the
 * documented OQ2 exception.
 */
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { CriveloLockup, SieveGrid } from "../brand";
import { Link } from "../../i18n/navigation";
import { NAV_ITEMS } from "./nav";
import { LangToggle } from "./LangToggle";

/** Section caption ("THE FAMILY"). */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

export function Footer() {
  const t = useTranslations("Shell");
  return (
    <footer className="mt-10 border-t border-border bg-bg-2">
      <div className="mx-auto box-border max-w-[1060px] px-6 pt-10 pb-8">
        <div className="mb-[22px] flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <CriveloLockup size="lg" />
            <span className="font-serif text-[18px] italic text-fg-2">
              {t("tagline")}
            </span>
          </div>
          <SieveGrid
            cols={5}
            rows={5}
            gap={12}
            dot={3.4}
            pad={2}
            fill={0.36}
            color="var(--fg)"
            accent="var(--fg-3)"
          />
        </div>

        <div className={cn(CAP, "mb-2.5")}>{t("theFamily")}</div>
        <div className="mb-6 flex flex-row flex-wrap gap-7">
          {NAV_ITEMS.map((it) => {
            const row = (
              <span className="flex items-center gap-[9px]">
                {/* Dot: token dots → className utility; external rgb → inline style (OQ2). */}
                <span
                  className={cn(
                    "h-[7px] w-[7px] shrink-0 rounded-full",
                    !it.dot && (it.markerClass ?? "bg-fg-4"),
                    it.soon && "opacity-50",
                  )}
                  style={it.dot ? { background: it.dot } : undefined}
                />
                <span
                  className={cn(
                    "text-[14.5px] font-semibold",
                    it.soon
                      ? "text-fg-4"
                      : "text-fg",
                  )}
                >
                  {it.name}
                </span>
                {it.soon && (
                  <span className="text-[11.5px] text-fg-4">
                    {t("soon")}
                  </span>
                )}
                {it.external && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="text-fg-3"
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                )}
              </span>
            );
            if (it.soon || !it.href) {
              return (
                <div key={it.name} className="py-[5px]">
                  {row}
                </div>
              );
            }
            return it.external ? (
              <a
                key={it.name}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-[5px] no-underline"
              >
                {row}
              </a>
            ) : (
              <Link
                key={it.name}
                href={it.href}
                className="py-[5px] no-underline"
              >
                {row}
              </Link>
            );
          })}
        </div>

        <div className="mb-[18px] h-px bg-border" />
        <div className="flex items-center justify-between">
          {/*
            The `copyright` message keeps the Portuguese tagline "Para quem vive
            café" in BOTH locales on purpose: it is Crivelo's primary brand
            signature, kept in its origin language like a motto. This is NOT a
            missed translation — do not "translate" it in messages/en.json.
          */}
          <span className="text-[12.5px] text-fg-3">
            {t("copyright")}
          </span>
          <LangToggle />
        </div>
      </div>
    </footer>
  );
}
