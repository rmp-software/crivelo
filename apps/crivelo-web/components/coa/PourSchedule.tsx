"use client";

/**
 * PourSchedule (RMP-191) — the phase bar + pour list. Ported from `scheduleEl`
 * in apps/crivelo-web/.design/project/coa-home.jsx.
 *
 * Phase bar: each segment is flex-weighted by its pour grams. Flavor pours are
 * teal (first pour = --brand, second = --accent-soft-2); strength pours are
 * graded through --pour-strength-rgb. List rows: time, "Pour N", +g, cumulative
 * g. A final row shows "Remove dripper · drawdown" at removeTime. All grams /
 * times come straight from the engine recipe.
 *
 * Styling (RMP-216): inline `style`/style-constants migrated to Tailwind utility
 * classes (the no-`var(--)`-in-`style` / no-inline-theming rule). Neutral tokens
 * ride arbitrary `text-[color:var(--fg-3)]` utilities; the tabular mono numerals
 * are `font-mono [font-feature-settings:'tnum','zero']`. The ONLY surviving inline
 * `style` is the phase-bar segment, whose flex weight AND fill colour are
 * per-step recipe DATA — they travel through CSS custom properties consumed by
 * static utilities.
 */
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Icon } from "./icons";
import type { Recipe } from "../../lib/four-six";

/** Section caption ("POUR SCHEDULE"). */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

/** Tabular mono numerals — keeps the values from jittering as digits change. */
const MONO = "font-mono [font-feature-settings:'tnum','zero']";

export interface PourScheduleProps {
  recipe: Recipe;
}

export function PourSchedule({ recipe }: PourScheduleProps) {
  const t = useTranslations("Schedule");
  const tCalc = useTranslations("Calculator");
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className={CAP}>{t("pourSchedule")}</span>
        <span
          className={cn(MONO, "inline-flex items-center gap-1.5 text-[13px] font-semibold")}
        >
          <Icon name="clock" size={14} className="text-fg-3" />
          {recipe.totalTime}
        </span>
      </div>

      {/* Phase bar */}
      <div className="mb-2 flex h-4 gap-[3px]">
        {recipe.steps.map((s) => {
          // last-resort: the segment's flex weight AND fill colour are per-step
          // recipe DATA (flavor pours = --brand / --accent-soft-2; strength pours
          // grade through --pour-strength-rgb by within-phase index — strength
          // pours start at global index 2 so the gradient stays progressive). A
          // runtime value can't live in a static utility class, so both travel
          // through CSS custom properties consumed by the `flex-[var(--flex)]` /
          // `bg-[var(--bar)]` utilities.
          const barVar = {
            "--flex": s.pour,
            "--bar":
              s.phase === "flavor"
                ? s.index === 0
                  ? "var(--brand)"
                  : "var(--accent-soft-2)"
                : `rgba(var(--pour-strength-rgb), ${Math.min(
                    1,
                    0.4 + 0.18 * (s.index - 2),
                  )})`,
          } as CSSProperties;
          return (
            <div
              key={s.index}
              title={t("pour", { n: s.index + 1 })}
              className="flex-[var(--flex)] rounded-[4px] bg-[var(--bar)]"
              style={barVar}
            />
          );
        })}
      </div>

      {/* Legend (RMP-242) — keys the bar's two colour families: flavor pours
          (brand teal) vs strength pours (the --pour-strength-rgb alpha ramp).
          The strength swatch is the ramp's mid alpha via the promoted
          `pour-strength` utility (crivelo-theme.css). */}
      <div className="mb-4 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-3">
          <span className="size-2.5 rounded-[3px] bg-brand" />
          {t("legendFlavor")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-3">
          <span className="size-2.5 rounded-[3px] bg-pour-strength/58" />
          {t("legendStrength")}
        </span>
      </div>

      {/* List */}
      <div>
        {recipe.steps.map((s) => (
          <div
            key={s.index}
            className="flex items-center gap-3 border-b border-border py-[7px]"
          >
            <span
              className={cn(MONO, "w-8 text-[13px] font-semibold text-fg-2")}
            >
              {s.time}
            </span>
            <span className="flex-1 text-small whitespace-nowrap text-fg-2">
              {t("pour", { n: s.index + 1 })}
            </span>
            <span className={cn(MONO, "text-caption text-fg-3")}>
              +{s.pourG}
            </span>
            <span
              className={cn(
                MONO,
                "w-[46px] text-right text-body font-semibold whitespace-nowrap",
              )}
            >
              {s.cumulativeG}
              <span className="text-[11px] text-fg-3">
                {" "}
                {tCalc("grams")}
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-[9px]">
          <span
            className={cn(MONO, "w-8 text-[13px] font-semibold text-fg-3")}
          >
            {recipe.removeTime}
          </span>
          <span className="flex-1 text-small text-fg-3">
            {t("removeDripper")}
          </span>
        </div>
      </div>
    </>
  );
}
