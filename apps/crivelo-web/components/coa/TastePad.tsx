"use client";

/**
 * TastePad (RMP-191) — the 2D taste pad. Ported from `padEl` in
 * apps/crivelo-web/.design/project/coa-home.jsx.
 *
 * The puck moves freely in BOTH axes (continuous x and y); the SieveGrid puck
 * neighbourhood follows it. The mapping to recipe inputs:
 *   - X → acidity = round((x*2 - 1) * 100) / 100  (continuous Sweet↔Bright)
 *   - Y → strengthPours = clamp(round(4 - y*3), 1, 4)  (ROUNDS; puck does NOT
 *     vertically snap — the puck keeps its free y position)
 *
 * Pointer drag uses pointer capture; touchAction:none keeps the pad from
 * scrolling on touch. The puck position is derived from acidity/strengthPours so
 * external changes (e.g. a reset) stay in sync, but a local free-y override keeps
 * the vertical drag smooth between the discrete strength rounds.
 */
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { SieveGrid } from "../brand";
import { clamp, tasteKey } from "../../lib/four-six";

/** Visually hidden but exposed to assistive tech (aria-live readouts). */
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

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

export interface PadDims {
  w: number;
  h: number;
  gap: number;
}

export interface TastePadProps {
  acidity: number;
  strengthPours: number;
  setAcidity: (v: number) => void;
  setStrength: (v: number) => void;
  dims: PadDims;
  /** Centre the pad horizontally (mobile single column). */
  center?: boolean;
}

export function TastePad({
  acidity,
  strengthPours,
  setAcidity,
  setStrength,
  dims,
  center = false,
}: TastePadProps) {
  const t = useTranslations("Taste");
  const summary = t("summary", {
    taste: t(tasteKey(acidity)),
    count: strengthPours,
  });
  const padRef = useRef<HTMLDivElement>(null);
  // Free continuous puck position. Seeded from the recipe inputs; vertical drag
  // keeps a free y while strength rounds underneath it.
  const [pad, setPad] = useState(() => ({
    x: (acidity + 1) / 2,
    y: (4 - strengthPours) / 3,
  }));
  // Focus state drives the visible focus ring (inline styles can't do :focus).
  const [focused, setFocused] = useState(false);

  const setFromXY = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fx = clamp((clientX - r.left) / r.width, 0, 1);
    const fy = clamp((clientY - r.top) / r.height, 0, 1);
    setPad({ x: fx, y: fy });
    setAcidity(Math.round((fx * 2 - 1) * 100) / 100);
    setStrength(clamp(Math.round(4 - fy * 3), 1, 4));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromXY(e.clientX, e.clientY);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setFromXY(e.clientX, e.clientY);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Keyboard control of the same acidity/strength state the drag drives.
  // ←/→ nudge acidity (±0.1, clamped [-1,1]); ↑/↓ change strength pours (±1,
  // clamped 1..4). The puck position is re-derived so it visibly tracks both.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let nextAcidity = acidity;
    let nextStrength = strengthPours;
    switch (e.key) {
      case "ArrowLeft":
        nextAcidity = clamp(Math.round((acidity - 0.1) * 100) / 100, -1, 1);
        break;
      case "ArrowRight":
        nextAcidity = clamp(Math.round((acidity + 0.1) * 100) / 100, -1, 1);
        break;
      case "ArrowUp":
        nextStrength = clamp(strengthPours + 1, 1, 4);
        break;
      case "ArrowDown":
        nextStrength = clamp(strengthPours - 1, 1, 4);
        break;
      case "Home":
        nextAcidity = -1;
        break;
      case "End":
        nextAcidity = 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (nextAcidity !== acidity) setAcidity(nextAcidity);
    if (nextStrength !== strengthPours) setStrength(nextStrength);
    setPad({ x: (nextAcidity + 1) / 2, y: (4 - nextStrength) / 3 });
  };

  const edge: CSSProperties = { ...CAP, fontSize: 10, position: "absolute" };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <span style={CAP}>{t("label")}</span>
        <span
          style={{
            ...MONO,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent-ink)",
            whiteSpace: "nowrap",
          }}
        >
          {summary}
        </span>
      </div>
      <div
        ref={padRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
        aria-label={t("padAria")}
        style={{
          position: "relative",
          // Fluid: the pad spans the full content/column width at every
          // breakpoint (the dot field stretches to fill via SieveGrid). Height
          // stays fixed per breakpoint so the card keeps a sensible aspect.
          width: "100%",
          maxWidth: center ? dims.w : undefined,
          height: dims.h,
          margin: center ? "0 auto" : 0,
          borderRadius: "var(--radius-md)",
          background: "var(--surface-raised)",
          boxShadow: "var(--shadow-1)",
          border: "1px solid var(--border)",
          outline: focused ? "2px solid var(--focus-ring)" : "none",
          outlineOffset: 2,
          cursor: "crosshair",
          touchAction: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 12 }}>
          <SieveGrid
            cols={9}
            rows={7}
            gap={dims.gap}
            dot={5}
            pad={6}
            puck={{ x: pad.x, y: pad.y }}
            accent="var(--accent-dot)"
            stretch
          />
        </div>
        <span style={{ ...edge, top: 10, left: "50%", transform: "translateX(-50%)" }}>
          {t("stronger")}
        </span>
        <span
          style={{ ...edge, bottom: 10, left: "50%", transform: "translateX(-50%)" }}
        >
          {t("lighter")}
        </span>
        <span style={{ ...edge, left: 12, top: "50%", transform: "translateY(-50%)" }}>
          {t("sweet")}
        </span>
        <span style={{ ...edge, right: 12, top: "50%", transform: "translateY(-50%)" }}>
          {t("bright")}
        </span>
        <div
          style={{
            position: "absolute",
            // Percentage-based so the puck tracks the fluid pad width and stays
            // aligned with the stretched dot field (inset 12px, matching the grid).
            left: `calc(12px + ${pad.x} * (100% - 24px))`,
            top: `calc(12px + ${pad.y} * (100% - 24px))`,
            transform: "translate(-50%,-50%)",
            width: 30,
            height: 30,
            borderRadius: 999,
            background: "var(--brand)",
            boxShadow: "0 0 0 6px var(--accent-halo), var(--shadow-1)",
            border: "2px solid var(--surface-raised)",
            pointerEvents: "none",
          }}
        />
        <span aria-live="polite" style={SR_ONLY}>
          {summary}
        </span>
      </div>
    </div>
  );
}
