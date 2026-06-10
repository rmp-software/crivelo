"use client";

/**
 * CoaCalculator (RMP-191) — the Coa homepage body: the 4:6 calculator (idle) and
 * the brew-timer view, switched by a `view` state. Ported from the idle layout
 * in docs/design/coa-v60/project/coa-home.jsx (intro / pad / inputs / panel /
 * schedule / CTA), minus the shell chrome (Header / NavSheet / Footer), which the
 * Shell already provides via app/[locale]/layout.tsx.
 *
 * Responsive (breakpoints from the design via useViewport): mobile <700 single
 * column (intro → pad → inputs → schedule → CTA); tablet 700–1023 and desktop
 * ≥1024 two columns (left: intro + pad + inputs; right: sticky "Your recipe"
 * panel with big water total + schedule + CTA).
 *
 * View state: idle ↔ brew. "Begin brew" → brew (the RMP-192 BrewTimer); the math
 * (lib/four-six.ts) is computed once here and handed to whichever view renders,
 * so the timer receives the exact same recipe the idle schedule shows.
 */
import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useRecipe } from "./useRecipe";
import { useViewport, type Breakpoint } from "./useViewport";
import { TastePad, type PadDims } from "./TastePad";
import { RecipeInputs } from "./RecipeInputs";
import { PourSchedule } from "./PourSchedule";
import { BrewTimer } from "./BrewTimer";
import { Icon } from "./icons";
import { tasteKey } from "../../lib/four-six";

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

type View = "idle" | "brew";

const PAD_DIMS: Record<Breakpoint, PadDims> = {
  desktop: { w: 430, h: 350, gap: 48 },
  tablet: { w: 380, h: 300, gap: 41 },
  mobile: { w: 350, h: 280, gap: 38 },
};

const CONTAINER_MAX: Record<Breakpoint, number> = {
  desktop: 1060,
  tablet: 680,
  mobile: 390,
};

export function CoaCalculator() {
  const t = useTranslations("Calculator");
  const tTaste = useTranslations("Taste");
  const bp = useViewport();
  const wide = bp !== "mobile";
  const containerMax = CONTAINER_MAX[bp];

  const {
    dose,
    setDose,
    ratio,
    setRatio,
    acidity,
    setAcidity,
    strengthPours,
    setStrength,
    recipe,
  } = useRecipe();

  const [view, setView] = useState<View>("idle");

  const startBrew = () => {
    setView("brew");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // Localized "{taste} · {n} pours" readout shared by the panel header.
  const tasteSummary = t("tasteSummary", {
    taste: tTaste(tasteKey(acidity)),
    count: strengthPours,
  });

  // ---------- pieces ----------
  const intro = (
    <div style={{ marginBottom: wide ? 24 : 20 }}>
      <div style={{ ...CAP, marginBottom: 8 }}>{t("introCaption")}</div>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: bp === "desktop" ? 30 : bp === "tablet" ? 25 : 19,
          color: "var(--fg-2)",
          margin: 0,
          lineHeight: 1.28,
          maxWidth: "17em",
        }}
      >
        {t("introLine")}
      </p>
    </div>
  );

  const pad = (
    <TastePad
      acidity={acidity}
      strengthPours={strengthPours}
      setAcidity={setAcidity}
      setStrength={setStrength}
      dims={PAD_DIMS[bp]}
      center={!wide}
    />
  );

  const inputs = (
    <RecipeInputs
      dose={dose}
      ratio={ratio}
      waterG={recipe.waterG}
      setDose={setDose}
      setRatio={setRatio}
      wide={wide}
    />
  );

  const panelHeader = wide && (
    <div
      style={{
        paddingBottom: 18,
        borderBottom: "1px solid var(--border)",
        marginBottom: 16,
      }}
    >
      <div style={{ ...CAP, marginBottom: 8 }}>{t("yourRecipe")}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
        <span
          style={{
            ...MONO,
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            color: "var(--accent-ink)",
            whiteSpace: "nowrap",
          }}
        >
          {recipe.waterG}
          <span style={{ fontSize: 20, color: "var(--fg-3)" }}> {t("grams")}</span>
        </span>
        <span
          style={{
            fontSize: 13.5,
            color: "var(--fg-2)",
            paddingBottom: 4,
            lineHeight: 1.4,
          }}
        >
          {t("doseRatioSummary", { dose, ratio })}
          <br />
          {tasteSummary}
        </span>
      </div>
    </div>
  );

  const schedule = <PourSchedule recipe={recipe} />;

  const cta = (
    <>
      <button
        onClick={startBrew}
        style={{
          width: "100%",
          height: 56,
          marginTop: 24,
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          background: "var(--brand)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          fontFamily: "var(--font-body)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "var(--shadow-1)",
        }}
      >
        <Icon name="play" size={18} color="#fff" /> {t("beginBrew")}{" "}
        <span style={{ ...MONO, opacity: 0.85 }}>{recipe.totalTime}</span>
      </button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <a
          href="https://crivelo.coffee/method/four-six"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 14,
            color: "var(--fg-2)",
            textDecoration: "none",
          }}
        >
          <Icon name="book" size={15} color="var(--fg-3)" />
          <span
            style={{
              textDecoration: "underline",
              textDecorationColor: "var(--border-strong)",
              textUnderlineOffset: 3,
            }}
          >
            {t("methodLink")}
          </span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--fg-3)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </>
  );

  if (view === "brew") {
    return (
      <BrewTimer
        recipe={recipe}
        onExit={() => setView("idle")}
        bp={bp}
        max={containerMax}
      />
    );
  }

  const panelStyle: CSSProperties = {
    background: "var(--surface-raised)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-1)",
    border: "1px solid var(--border)",
    padding: bp === "desktop" ? 28 : 24,
  };

  if (wide) {
    return (
      <main
        style={{
          maxWidth: containerMax,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: bp === "desktop" ? "40px 24px 8px" : "28px 24px 8px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: bp === "desktop" ? 56 : 36,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {intro}
            {pad}
            {inputs}
          </div>
          <div
            style={{
              ...panelStyle,
              position: bp === "desktop" ? "sticky" : "static",
              top: 90,
            }}
          >
            {panelHeader}
            {schedule}
            {cta}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 390,
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "20px 20px 8px",
      }}
    >
      {intro}
      <div style={{ marginBottom: 12 }}>{pad}</div>
      <div style={{ marginBottom: 22 }}>{inputs}</div>
      {schedule}
      {cta}
    </main>
  );
}
