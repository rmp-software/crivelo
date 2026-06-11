"use client";

/**
 * RecipeInputs (RMP-191) — Coffee + Ratio steppers and the live Water total.
 *
 * Coffee: ±1 g, clamp 8–60. Ratio: 1:n, clamp 12–18. Water = dose × ratio,
 * straight from the engine recipe (never recomputed here). Water stays here at
 * every breakpoint as an at-a-glance readout; on wide layouts it is also surfaced
 * big in the "Your recipe" panel (intentional redundancy).
 *
 * Layout: a 3-column CSS grid (Tailwind `grid-cols-3`). Each control owns an
 * equal third and is centred in it, so the row can NEVER wrap or overflow its
 * container — whether that's the ~298px tablet left column, a 350px phone, or a
 * desktop column. Controls are sized to fit the tightest real container with
 * margin to spare, so there is no viewport-dependent sizing and nothing to clip.
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "./icons";
import { clamp } from "../../lib/four-six";

/** Tabular mono numerals — keeps the values from jittering as digits change. */
const MONO = {
  fontFamily: "var(--font-mono)",
  fontFeatureSettings: '"tnum","zero"',
} as const;

const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--fg-3)]";

function StepButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--fg)] transition-colors hover:border-[color:var(--brand)]"
    >
      {children}
    </button>
  );
}

function Stepper({
  label,
  value,
  dec,
  inc,
  decLabel,
  incLabel,
}: {
  label: string;
  value: string;
  dec: () => void;
  inc: () => void;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className={LABEL}>{label}</span>
      <div className="flex items-center gap-1">
        <StepButton onClick={dec} label={decLabel}>
          <Icon name="minus" size={12} />
        </StepButton>
        <span
          className="text-[15px] font-semibold tabular-nums whitespace-nowrap"
          style={MONO}
        >
          {value}
        </span>
        <StepButton onClick={inc} label={incLabel}>
          <Icon name="plus" size={12} />
        </StepButton>
      </div>
    </div>
  );
}

export interface RecipeInputsProps {
  dose: number;
  ratio: number;
  waterG: number;
  setDose: (v: number) => void;
  setRatio: (v: number) => void;
}

export function RecipeInputs({
  dose,
  ratio,
  waterG,
  setDose,
  setRatio,
}: RecipeInputsProps) {
  const t = useTranslations("Inputs");
  const tCalc = useTranslations("Calculator");
  const coffee = t("coffee");
  const ratioLabel = t("ratio");

  return (
    <div className="grid grid-cols-3 items-end gap-1 border-y border-[color:var(--border)] px-1 py-4">
      <Stepper
        label={coffee}
        value={`${dose} ${tCalc("grams")}`}
        decLabel={t("decrease", { label: coffee })}
        incLabel={t("increase", { label: coffee })}
        dec={() => setDose(clamp(dose - 1, 8, 60))}
        inc={() => setDose(clamp(dose + 1, 8, 60))}
      />
      <Stepper
        label={ratioLabel}
        value={`1:${ratio}`}
        decLabel={t("decrease", { label: ratioLabel })}
        incLabel={t("increase", { label: ratioLabel })}
        dec={() => setRatio(clamp(ratio - 1, 12, 18))}
        inc={() => setRatio(clamp(ratio + 1, 12, 18))}
      />
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <span className={LABEL}>{t("water")}</span>
        <span
          className="text-[17px] font-semibold tabular-nums whitespace-nowrap text-[color:var(--accent-ink)]"
          style={MONO}
        >
          {waterG} {tCalc("grams")}
        </span>
      </div>
    </div>
  );
}
