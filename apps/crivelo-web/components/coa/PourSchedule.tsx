"use client";

/**
 * PourSchedule (RMP-191) — the phase bar + pour list. Ported from `scheduleEl`
 * in docs/design/coa-v60/project/coa-home.jsx.
 *
 * Phase bar: each segment is flex-weighted by its pour grams. Flavor pours are
 * teal (first pour = --brand, second = --accent-soft-2); strength pours are
 * graded through --pour-strength-rgb. List rows: time, "Pour N", +g, cumulative
 * g. A final row shows "Remove dripper · drawdown" at removeTime. All grams /
 * times come straight from the engine recipe.
 */
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "./icons";
import type { Recipe } from "../../lib/four-six";

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

export interface PourScheduleProps {
  recipe: Recipe;
}

export function PourSchedule({ recipe }: PourScheduleProps) {
  const t = useTranslations("Schedule");
  const tCalc = useTranslations("Calculator");
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={CAP}>{t("pourSchedule")}</span>
        <span
          style={{
            ...MONO,
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="clock" size={14} color="var(--fg-3)" />
          {recipe.totalTime}
        </span>
      </div>

      {/* Phase bar */}
      <div style={{ display: "flex", gap: 3, height: 16, marginBottom: 16 }}>
        {recipe.steps.map((s) => (
          <div
            key={s.index}
            title={t("pour", { n: s.index + 1 })}
            style={{
              flex: s.pour,
              borderRadius: 4,
              background:
                s.phase === "flavor"
                  ? s.index === 0
                    ? "var(--brand)"
                    : "var(--accent-soft-2)"
                  : // Grade strength bars by their WITHIN-PHASE index (strength
                    // pours start at global index 2) so the gradient stays
                    // progressive instead of flattening at high strength.
                    `rgba(var(--pour-strength-rgb), ${Math.min(
                      1,
                      0.4 + 0.18 * (s.index - 2),
                    )})`,
            }}
          />
        ))}
      </div>

      {/* List */}
      <div>
        {recipe.steps.map((s) => (
          <div
            key={s.index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "7px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                ...MONO,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--fg-2)",
                width: 32,
              }}
            >
              {s.time}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                color: "var(--fg-2)",
                whiteSpace: "nowrap",
              }}
            >
              {t("pour", { n: s.index + 1 })}
            </span>
            <span style={{ ...MONO, fontSize: 12, color: "var(--fg-3)" }}>
              +{s.pourG}
            </span>
            <span
              style={{
                ...MONO,
                fontSize: 16,
                fontWeight: 600,
                width: 46,
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {s.cumulativeG}
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
                {" "}
                {tCalc("grams")}
              </span>
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "9px 0 0",
          }}
        >
          <span
            style={{
              ...MONO,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-3)",
              width: 32,
            }}
          >
            {recipe.removeTime}
          </span>
          <span style={{ flex: 1, fontSize: 14, color: "var(--fg-3)" }}>
            {t("removeDripper")}
          </span>
        </div>
      </div>
    </>
  );
}
