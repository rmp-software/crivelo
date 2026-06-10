"use client";

/**
 * BrewView (RMP-191) — placeholder for the running brew timer. The real
 * BrewTimer (live dial, pour guidance, countdown, localStorage resume) lands in
 * RMP-192 and replaces the body of this component; the surrounding view-state
 * wiring in CoaCalculator stays unchanged. For now it renders a centred stub
 * with a back-to-recipe affordance so the "Begin brew" ↔ "Back to recipe" flow
 * is exercisable end to end.
 */
import type { CSSProperties } from "react";
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

export interface BrewViewProps {
  recipe: Recipe;
  onExit: () => void;
  maxWidth: number;
}

export function BrewView({ recipe, onExit, maxWidth }: BrewViewProps) {
  return (
    <main
      style={{
        maxWidth,
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "48px 24px 24px",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div style={CAP}>Brew timer — RMP-192</div>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 24,
          color: "var(--fg-2)",
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        The guided brew timer lands next.
      </p>
      <div
        style={{
          ...MONO,
          fontSize: 15,
          fontWeight: 600,
          color: "var(--accent-ink)",
        }}
      >
        {recipe.waterG} g · {recipe.totalTime}
      </div>
      <button
        onClick={onExit}
        style={{
          marginTop: 8,
          height: 48,
          padding: "0 24px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--fg)",
          fontWeight: 600,
          fontSize: 15,
          fontFamily: "var(--font-body)",
          cursor: "pointer",
        }}
      >
        Back to recipe
      </button>
    </main>
  );
}
