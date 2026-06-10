"use client";

/**
 * RecipeInputs (RMP-191) — Coffee + Ratio steppers and (mobile only) the live
 * Water total. Ported from `inputsEl` / `MiniStep` in
 * apps/crivelo-web/.design/project/coa-home.jsx.
 *
 * Coffee: ±1 g, clamp 8–60. Ratio: 1:n, clamp 12–18. Water = dose × ratio,
 * straight from the engine recipe (never recomputed here). On wide layouts the
 * Water total moves into the "Your recipe" panel, so it is hidden here.
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
            minWidth: 44,
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
  /** Wide layouts surface Water in the recipe panel, not inline. */
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
  const divider: CSSProperties = {
    width: 1,
    height: 34,
    background: "var(--border)",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: wide ? "flex-start" : "space-between",
        gap: wide ? 28 : 0,
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
      />
      <div style={divider} />
      <MiniStep
        label={ratioLabel}
        value={`1:${ratio}`}
        decLabel={t("decrease", { label: ratioLabel })}
        incLabel={t("increase", { label: ratioLabel })}
        dec={() => setRatio(clamp(ratio - 1, 12, 18))}
        inc={() => setRatio(clamp(ratio + 1, 12, 18))}
      />
      {!wide && (
        <>
          <div style={divider} />
          <div style={{ textAlign: "center" }}>
            <div style={{ ...CAP, marginBottom: 5 }}>{t("water")}</div>
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
        </>
      )}
    </div>
  );
}
