"use client";

/**
 * RecipeInputs (RMP-191) — Coffee + Ratio steppers and the live Water total.
 * Ported from `inputsEl` / `MiniStep` in apps/crivelo-web/.design/project/coa-home.jsx.
 *
 * Coffee: ±1 g, clamp 8–60. Ratio: 1:n, clamp 12–18. Water = dose × ratio,
 * straight from the engine recipe (never recomputed here). Water stays on this
 * row at every breakpoint as an at-a-glance readout; on wide layouts it is also
 * surfaced big in the "Your recipe" panel (intentional redundancy).
 *
 * Layout: Coffee · Ratio · Water sit on one line, spread edge-to-edge. On mobile
 * the controls render compact and the two steppers are BONDED into one group so
 * they can never split apart — if the effective width is too small (e.g. the page
 * is zoomed), only the Water readout drops cleanly to a second line rather than
 * being clipped off the right edge. The row never overflows/clips.
 */
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "./icons";
import { clamp } from "../../lib/four-six";

const CAP: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 600,
  color: "var(--fg-3)",
};

const MONO: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontFeatureSettings: '"tnum","zero"',
};

function MiniStep({
  label,
  value,
  decLabel,
  incLabel,
  dec,
  inc,
  compact,
}: {
  label: string;
  value: string;
  decLabel: string;
  incLabel: string;
  dec: () => void;
  inc: () => void;
  compact: boolean;
}) {
  const size = compact ? 22 : 26;
  const btn: CSSProperties = {
    width: size,
    height: size,
    flex: "0 0 auto",
    borderRadius: 999,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--fg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ ...CAP, marginBottom: 6 }}>{label}</div>
      <div
        style={{ display: "flex", alignItems: "center", gap: compact ? 5 : 8 }}
      >
        <button type="button" style={btn} onClick={dec} aria-label={decLabel}>
          <Icon name="minus" size={compact ? 12 : 13} />
        </button>
        <span
          style={{
            ...MONO,
            fontSize: compact ? 16 : 17,
            fontWeight: 600,
            minWidth: compact ? 0 : 42,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
        <button type="button" style={btn} onClick={inc} aria-label={incLabel}>
          <Icon name="plus" size={compact ? 12 : 13} />
        </button>
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
  /** Wide layouts use comfortable controls; mobile renders them compact. */
  wide?: boolean;
}

export function RecipeInputs({
  dose,
  ratio,
  waterG,
  setDose,
  setRatio,
  wide = false,
}: RecipeInputsProps) {
  const t = useTranslations("Inputs");
  const tCalc = useTranslations("Calculator");
  const coffee = t("coffee");
  const ratioLabel = t("ratio");
  const compact = !wide;

  const coffeeStep = (
    <MiniStep
      label={coffee}
      value={`${dose} ${tCalc("grams")}`}
      decLabel={t("decrease", { label: coffee })}
      incLabel={t("increase", { label: coffee })}
      dec={() => setDose(clamp(dose - 1, 8, 60))}
      inc={() => setDose(clamp(dose + 1, 8, 60))}
      compact={compact}
    />
  );

  const ratioStep = (
    <MiniStep
      label={ratioLabel}
      value={`1:${ratio}`}
      decLabel={t("decrease", { label: ratioLabel })}
      incLabel={t("increase", { label: ratioLabel })}
      dec={() => setRatio(clamp(ratio - 1, 12, 18))}
      inc={() => setRatio(clamp(ratio + 1, 12, 18))}
      compact={compact}
    />
  );

  const water = (
    <div style={{ textAlign: "center" }}>
      <div style={{ ...CAP, marginBottom: 6 }}>{t("water")}</div>
      <div
        style={{
          ...MONO,
          fontSize: compact ? 17 : 19,
          fontWeight: 600,
          color: "var(--accent-ink)",
          whiteSpace: "nowrap",
        }}
      >
        {waterG} {tCalc("grams")}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        // One line at every supported width, spread edge-to-edge. flexWrap is the
        // release valve: if the effective width is too small (e.g. the page is
        // zoomed in), Water drops to a second line instead of being clipped — the
        // row never overflows. The steppers are bonded below so they never split.
        flexWrap: "wrap",
        justifyContent: "space-between",
        columnGap: 12,
        rowGap: 14,
        padding: "16px 4px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? 18 : 28,
          // The two steppers stay together as one unit; they never split across
          // lines. Only Water may wrap.
          flex: "0 1 auto",
        }}
      >
        {coffeeStep}
        {ratioStep}
      </div>
      {water}
    </div>
  );
}
