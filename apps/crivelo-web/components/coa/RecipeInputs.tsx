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
 * Layout: Coffee · Ratio · Water always sit on ONE line, spread edge-to-edge —
 * the row never wraps. On mobile the controls render compact (smaller buttons /
 * text) so the three fit comfortably with slack to spare even on narrow screens
 * and with wider fallback fonts.
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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        // One line, spread edge-to-edge. Never wraps — on mobile the compact
        // controls leave plenty of slack so all three stay on a single row.
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 10,
        padding: "16px 4px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <MiniStep
        label={coffee}
        value={`${dose} ${tCalc("grams")}`}
        decLabel={t("decrease", { label: coffee })}
        incLabel={t("increase", { label: coffee })}
        dec={() => setDose(clamp(dose - 1, 8, 60))}
        inc={() => setDose(clamp(dose + 1, 8, 60))}
        compact={compact}
      />
      <MiniStep
        label={ratioLabel}
        value={`1:${ratio}`}
        decLabel={t("decrease", { label: ratioLabel })}
        incLabel={t("increase", { label: ratioLabel })}
        dec={() => setRatio(clamp(ratio - 1, 12, 18))}
        inc={() => setRatio(clamp(ratio + 1, 12, 18))}
        compact={compact}
      />
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
    </div>
  );
}
