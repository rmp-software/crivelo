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
 *
 * Input ergonomics: the ± buttons keep their 24px glyph but expose a 44×44px
 * hit area (RMP-233), auto-repeat on press-hold, and the value itself is
 * tappable for direct numeric entry (RMP-243).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";
import { cn } from "@crivelo/ui/lib/utils";
import { Icon } from "./icons";
import { clamp } from "../../lib/four-six";

/** Tabular mono numerals — keeps the values from jittering as digits change. */
const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

/** Press-hold auto-repeat timings (RMP-243): first repeat after HOLD_DELAY_MS,
 * then one step every HOLD_INTERVAL_MS until release. */
const HOLD_DELAY_MS = 450;
const HOLD_INTERVAL_MS = 80;

function StepButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  // Routed through the app-local Button wrapper (RMP-217 commodity-UI sweep). The
  // 24px circular stepper geometry rides in className via tailwind-merge so the
  // primitive's buttonVariants defaults (h-9/px, rounded-md, bg-primary, gap-2,
  // transition-all, the 16px svg rule) are neutralised — pixel identical to the
  // prior hand-rolled <button>. Hover recolours the border only, so the default
  // hover:bg-primary/90 is cancelled with hover:bg-surface.
  //
  // Hit area (RMP-233): the layout box stays 24px so the row metrics don't
  // change; an ::after overlay at -inset-2.5 (10px per side) grows the
  // effective touch target to 44×44px.
  //
  // Press-hold repeat (RMP-243): pointerdown arms a delay, then an interval
  // steps until pointerup/leave/cancel. The latest onClick closure is kept in a
  // ref so repeats never step from a stale value (each step re-renders with a
  // fresh clamp closure); the release click after a hold is swallowed via
  // heldRef so a plain tap still steps exactly once. Keyboard activation only
  // fires click, so its behaviour is unchanged.
  const stepRef = useRef(onClick);
  stepRef.current = onClick;
  const heldRef = useRef(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopHold = () => {
    if (delayRef.current !== null) clearTimeout(delayRef.current);
    if (repeatRef.current !== null) clearInterval(repeatRef.current);
    delayRef.current = null;
    repeatRef.current = null;
  };
  useEffect(() => stopHold, []);

  return (
    <Button
      type="button"
      onClick={() => {
        if (heldRef.current) {
          heldRef.current = false;
          return; // the hold already stepped; swallow the release click
        }
        onClick();
      }}
      onPointerDown={() => {
        heldRef.current = false;
        delayRef.current = setTimeout(() => {
          heldRef.current = true;
          stepRef.current();
          repeatRef.current = setInterval(
            () => stepRef.current(),
            HOLD_INTERVAL_MS,
          );
        }, HOLD_DELAY_MS);
      }}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      aria-label={label}
      className="relative grid h-6 w-6 shrink-0 cursor-pointer touch-none place-items-center rounded-full border border-border-strong bg-surface p-0 text-fg transition-colors select-none after:absolute after:-inset-2.5 after:rounded-full after:content-[''] hover:border-brand hover:bg-surface has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-[12px]"
    >
      {children}
    </Button>
  );
}

function Stepper({
  label,
  value,
  num,
  mode,
  dec,
  inc,
  commit,
  decLabel,
  incLabel,
  editLabel,
}: {
  label: string;
  value: string;
  /** Current numeric value — seeds the direct-entry input. */
  num: number;
  /** "decimal" for dose (halves allowed), "numeric" for the integer ratio. */
  mode: "decimal" | "numeric";
  dec: () => void;
  inc: () => void;
  /** Direct-entry commit — the caller rounds + clamps before storing. */
  commit: (n: number) => void;
  decLabel: string;
  incLabel: string;
  editLabel: string;
}) {
  // Direct entry (RMP-243): tap the value to edit. draft === null ⇒ display
  // mode. Enter/blur commits (parse → caller clamps), Escape reverts.
  const [draft, setDraft] = useState<string | null>(null);
  const commitDraft = () => {
    if (draft === null) return;
    const n = Number.parseFloat(draft.replace(",", ".")); // pt-BR decimal comma
    if (Number.isFinite(n)) commit(n);
    setDraft(null);
  };

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className={LABEL}>{label}</span>
      <div className="flex items-center gap-1">
        <StepButton onClick={dec} label={decLabel}>
          <Icon name="minus" size={12} />
        </StepButton>
        {draft === null ? (
          <button
            type="button"
            aria-label={editLabel}
            onClick={() => setDraft(String(num))}
            className={cn(
              "text-mono cursor-text font-semibold whitespace-nowrap",
              MONO,
            )}
          >
            {value}
          </button>
        ) : (
          <input
            autoFocus
            inputMode={mode}
            value={draft}
            aria-label={editLabel}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setDraft(null);
            }}
            className={cn(
              "text-mono w-12 border-b border-border-strong bg-transparent text-center font-semibold outline-none",
              MONO,
            )}
          />
        )}
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
    <div className="grid grid-cols-3 items-end gap-1 border-y border-border px-1 py-4">
      <Stepper
        label={coffee}
        value={`${dose} ${tCalc("grams")}`}
        num={dose}
        mode="decimal"
        decLabel={t("decrease", { label: coffee })}
        incLabel={t("increase", { label: coffee })}
        editLabel={t("edit", { label: coffee })}
        dec={() => setDose(clamp(dose - 1, 8, 60))}
        inc={() => setDose(clamp(dose + 1, 8, 60))}
        // The engine takes any finite dose, so direct entry allows halves —
        // snap to 0.5 g, then clamp to the stepper range.
        commit={(n) => setDose(clamp(Math.round(n * 2) / 2, 8, 60))}
      />
      <Stepper
        label={ratioLabel}
        value={`1:${ratio}`}
        num={ratio}
        mode="numeric"
        decLabel={t("decrease", { label: ratioLabel })}
        incLabel={t("increase", { label: ratioLabel })}
        editLabel={t("edit", { label: ratioLabel })}
        dec={() => setRatio(clamp(ratio - 1, 12, 18))}
        inc={() => setRatio(clamp(ratio + 1, 12, 18))}
        commit={(n) => setRatio(clamp(Math.round(n), 12, 18))}
      />
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <span className={LABEL}>{t("water")}</span>
        <span
          className={cn(
            "text-h4 font-semibold whitespace-nowrap text-accent-ink",
            MONO,
          )}
        >
          {waterG} {tCalc("grams")}
        </span>
      </div>
    </div>
  );
}
