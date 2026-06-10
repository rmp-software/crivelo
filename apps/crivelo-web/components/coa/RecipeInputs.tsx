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
 * Layout: on wide layouts the three items spread edge-to-edge (no wrap — the
 * column is always wide enough). On mobile the two steppers are bonded into one
 * group that can never split apart; only the Water readout may drop to a second
 * line on very narrow screens, which stays clean (steppers never break up).
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
}: {
  label: string;
  value: string;
  decLabel: string;
  incLabel: string;
  dec: () => void;
  inc: () => void;
}) {
  const btn: CSSProperties = {
    width: 26,
    height: 26,
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" style={btn} onClick={dec} aria-label={decLabel}>
          <Icon name="minus" size={13} />
        </button>
        <span
          style={{
            ...MONO,
            fontSize: 17,
            fontWeight: 600,
            minWidth: 42,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
        <button type="button" style={btn} onClick={inc} aria-label={incLabel}>
          <Icon name="plus" size={13} />
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
  /** Wide layouts spread all three items edge-to-edge; mobile bonds the steppers. */
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

  const coffeeStep = (
    <MiniStep
      label={coffee}
      value={`${dose} ${tCalc("grams")}`}
      decLabel={t("decrease", { label: coffee })}
      incLabel={t("increase", { label: coffee })}
      dec={() => setDose(clamp(dose - 1, 8, 60))}
      inc={() => setDose(clamp(dose + 1, 8, 60))}
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
    />
  );

  const water = (
    <div style={{ textAlign: "center" }}>
      <div style={{ ...CAP, marginBottom: 6 }}>{t("water")}</div>
      <div
        style={{
          ...MONO,
          fontSize: 19,
          fontWeight: 600,
          color: "var(--accent-ink)",
          whiteSpace: "nowrap",
        }}
      >
        {waterG} {tCalc("grams")}
      </div>
    </div>
  );

  const frame: CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "16px 4px",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  };

  // Wide: three items spread edge-to-edge on one line (the column is always wide
  // enough, so no wrap is needed).
  if (wide) {
    return (
      <div style={{ ...frame, justifyContent: "space-between" }}>
        {coffeeStep}
        {ratioStep}
        {water}
      </div>
    );
  }

  // Mobile: the two steppers are bonded so they can never split apart. Only Water
  // may wrap to a second line on very narrow screens, and it stays centred.
  return (
    <div
      style={{
        ...frame,
        flexWrap: "wrap",
        justifyContent: "space-between",
        columnGap: 16,
        rowGap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flex: "1 1 auto",
          justifyContent: "space-between",
        }}
      >
        {coffeeStep}
        {ratioStep}
      </div>
      {water}
    </div>
  );
}
