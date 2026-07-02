"use client";

/**
 * LastBrewBar (feature: coa-save-recipes) — surfaces the most recently completed
 * brew (the implicit `coa-last-brew` slot) so it can be re-launched without
 * re-dialing the inputs. It renders ONLY when a last brew exists; with an empty
 * slot it renders nothing.
 *
 * Two presentations, picked by the `variant` prop (driven by CoaCalculator's
 * `wide` viewport signal):
 *
 *  - **`bar`** (mobile / narrow home) — a sticky bottom bar that *floats over*
 *    content (`position: fixed`). Because it's out of flow its post-mount reveal
 *    causes **zero layout shift** (the whole point of replacing the old in-flow
 *    card). It sits above `env(safe-area-inset-bottom)` (installed-PWA home
 *    indicator) via a `calc()` arbitrary — `env()` is a runtime value, not a
 *    design token, so the arbitrary is a legitimate runtime bridge. Sits under
 *    modals in z-order (`z-30` < the Dialog/AlertDialog overlay).
 *  - **`inline`** (desktop / tablet two-column) — a compact inline row rendered
 *    in the left column where the old `homeExtras` block lived (a floating bar
 *    reads oddly across the wide canvas).
 *
 * Actions (both route through the locale-aware `useRouter`):
 *  - "Brew again" / "Again" → `brewHref(params, false)` (autostart=0 → the brew
 *    route's "ready" state), styled **tonal** (brand-soft bg + accent-ink
 *    ink/border) so it stays secondary to the solid "Begin brew" CTA.
 *  - Edit → `editHref(params)` (the calculator pre-filled with these params).
 *    In the bar variant the whole TEXT BLOCK is the edit affordance (RMP-237
 *    mockup: the edit icon-button is dropped — tapping the summary opens the
 *    calculator pre-filled, which is what edit does); the inline variant keeps
 *    the icon button.
 *
 * Client-only after mount: `getLastBrew()` reads `localStorage` (null on the
 * server). We read it in an effect behind a `mounted` flag so the server + first
 * client paint both render nothing (matching markup → no hydration mismatch),
 * then the bar appears on the post-mount commit. The `bar` variant additionally
 * fades up on reveal via a CSS transition, gated behind `prefers-reduced-motion`
 * (the `motion-reduce:` variant) — no motion library.
 *
 * Styling: house tokens/utilities only (no raw hex / no inline `var()`).
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { useRouter } from "../../i18n/navigation";
import { brewHref, editHref } from "../../lib/coa-nav";
import { getLastBrew, type LastBrew } from "../../lib/recipes-store";
import { doseRatioSummary, paramsSummary } from "../../lib/recipe-summary";
import { tasteKey } from "../../lib/four-six";
import { Icon } from "./icons";
import { CAP, MONO } from "./style-tokens";

export type LastBrewBarVariant = "bar" | "inline";

export interface LastBrewBarProps {
  /** `bar` = sticky bottom bar (narrow); `inline` = compact left-column row (wide). */
  variant: LastBrewBarVariant;
}

/**
 * Read the `coa-last-brew` slot post-mount (SSR-safe) and resolve its localized
 * params summary. Returns `null` until mounted or when there is no last brew.
 */
function useLastBrewSummary(): {
  lastBrew: LastBrew;
  summary: string;
  taste: string;
} | null {
  const tTaste = useTranslations("Taste");
  const [lastBrew, setLastBrew] = useState<LastBrew | null>(null);
  useEffect(() => {
    setLastBrew(getLastBrew());
  }, []);

  if (!lastBrew) return null;
  const taste = tTaste(tasteKey(lastBrew.params.acidity));
  return { lastBrew, summary: paramsSummary(lastBrew.params, taste), taste };
}

export function LastBrewBar({ variant }: LastBrewBarProps) {
  const t = useTranslations("LastBrew");
  const router = useRouter();
  const data = useLastBrewSummary();
  const hasData = !!data;

  // Reveal flag for the bottom-bar fade-up: flip on after the first committed
  // render that has data, so the transition has a from/to state to animate
  // between. Reduced motion short-circuits the transition (motion-reduce:* below).
  // Depend on the boolean, not `data` — `data` is a fresh object every render, so
  // depending on it would re-run this effect on every render (harmless but
  // imprecise). The reveal only cares whether data exists.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (hasData) setRevealed(true);
  }, [hasData]);

  if (!data) return null;
  const { lastBrew, summary, taste } = data;
  const { params } = lastBrew;

  const brewAgain = (
    <Button
      onClick={() => router.push(brewHref(params, false))}
      className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-md border border-accent-ink bg-brand-soft px-3.5 font-body text-small font-semibold whitespace-nowrap text-accent-ink shadow-none hover:bg-brand-soft hover:text-accent-ink has-[>svg]:px-3.5 [&_svg:not([class*='size-'])]:size-[15px]"
    >
      <Icon name="play" size={15} /> {t("brewAgain")}
    </Button>
  );

  const edit = (
    <Button
      onClick={() => router.push(editHref(params))}
      aria-label={t("edit")}
      className="flex size-[38px] shrink-0 items-center justify-center rounded-md border border-border-strong bg-transparent p-0 text-fg-2 shadow-none hover:bg-transparent hover:text-fg has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-4"
    >
      <Icon name="edit" size={16} />
    </Button>
  );

  const lead = (
    // History/restart glyph — NOT `bookmark` (that's the header's saved-recipes
    // affordance). Reusing bookmark here would make "last brew" and "saved
    // recipes" read as the same control.
    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-md bg-brand-soft text-accent-ink">
      <Icon name="history" size={17} />
    </span>
  );

  // Inline-variant text block (unchanged legacy shape: caption + one-line
  // ellipsized summary).
  const text = (
    <div className="min-w-0 flex-1">
      <div className={cn(CAP, "leading-none")}>{t("title")}</div>
      <div className={cn("mt-1 truncate text-small text-fg-2", MONO)}>
        {summary}
      </div>
    </div>
  );

  if (variant === "inline") {
    // Compact left-column row (wide layout). In flow, no float — it reads as a
    // small card, not the old full-width panel.
    return (
      <section
        aria-label={t("title")}
        className="flex items-center gap-3 rounded-md border border-border bg-surface-raised p-3 shadow-1"
      >
        {lead}
        {text}
        {brewAgain}
        {edit}
      </section>
    );
  }

  // Sticky bottom bar (narrow). `fixed` + out of flow → zero layout shift. Above
  // the home-indicator safe area; under modals in z-order.
  // RMP-237 (per the review mockup): single row — payload FIRST. Line 1 is the
  // recipe numbers + pour count in mono; line 2 is the muted label + taste. The
  // text block itself is the edit affordance (tap → calculator pre-filled), the
  // action shrinks to one word, and the redundant edit icon-button is gone.
  // Nothing truncates: the summary may wrap at very narrow widths instead.
  return (
    <section
      aria-label={t("title")}
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-3 z-30 mx-auto flex max-w-[366px] items-center gap-2.5 rounded-lg border border-border-strong bg-surface-raised/90 p-2 pl-3.5 shadow-1 backdrop-blur-md",
        "transition-[opacity,transform] duration-stage ease-standard motion-reduce:transition-none",
        revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {lead}
      <button
        type="button"
        onClick={() => router.push(editHref(params))}
        aria-label={t("edit")}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <div className={cn("text-[13.5px] font-semibold", MONO)}>
          {doseRatioSummary(params)} ·{" "}
          {t("pours", { count: params.strengthPours })}
        </div>
        <div className="text-[12px] text-fg-3">
          {t("title")} · {taste}
        </div>
      </button>
      {/* No play glyph here (unlike the inline pill): the icon's ~20px is what
          keeps the pt-BR payload line unwrapped at 366px. */}
      <Button
        onClick={() => router.push(brewHref(params, false))}
        className="flex h-[38px] shrink-0 items-center rounded-md border border-accent-ink bg-brand-soft px-3.5 font-body text-small font-semibold whitespace-nowrap text-accent-ink shadow-none hover:bg-brand-soft hover:text-accent-ink"
      >
        {t("again")}
      </Button>
    </section>
  );
}
