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
 *
 * Styling (RMP-216): inline `style`/style-constants migrated to Tailwind utility
 * classes (the no-`var(--)`-in-`style` / no-inline-theming rule). Neutral tokens
 * ride arbitrary `text-[color:var(--fg-3)]` utilities; the accent summary uses the
 * promoted `text-accent-ink`. The focus ring is a conditional className driven by
 * the `focused` state. The two surviving inline `style`s are genuinely
 * data-driven: the pad's runtime dims (center/dims props) and the puck's
 * continuous left/top, both threaded through CSS custom properties consumed by
 * static utilities.
 */
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { SieveGrid } from "../brand";
import { clamp, tasteKey } from "../../lib/four-six";

/** Section caption ("TASTE"). */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--fg-3)]";

/** Tabular mono numerals — keeps the summary from jittering as digits change. */
const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

/** Edge label (absolute, slightly smaller than the section caption). */
const EDGE = cn(CAP, "absolute text-[10px]");

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
  // Focus state drives the visible focus ring (a conditional className — utility
  // classes can't express :focus on this drag surface directly here).
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

  // last-resort: the pad's box is sized from runtime props — `center` toggles a
  // max-width cap + horizontal auto-centring (mobile single column), and the
  // height is the per-breakpoint `dims.h`. These runtime values travel through
  // CSS custom properties consumed by the static `max-w-[var(--pad-maxw)]` /
  // `h-[var(--pad-h)]` / `mx-[var(--pad-mx)]` utilities below.
  const padBoxVar = {
    "--pad-maxw": center ? `${dims.w}px` : "none",
    "--pad-h": `${dims.h}px`,
    "--pad-mx": center ? "auto" : "0",
  } as CSSProperties;

  // last-resort: the puck is positioned from the continuous drag state (pad.x /
  // pad.y). Percentage-based so it tracks the fluid pad width and stays aligned
  // with the stretched dot field (inset 12px, matching the grid). The computed
  // left/top travel through CSS custom properties consumed by the static
  // `left-[var(--puck-x)]` / `top-[var(--puck-y)]` utilities.
  const puckVar = {
    "--puck-x": `calc(12px + ${pad.x} * (100% - 24px))`,
    "--puck-y": `calc(12px + ${pad.y} * (100% - 24px))`,
  } as CSSProperties;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className={CAP}>{t("label")}</span>
        <span
          className={cn(
            MONO,
            "text-[13px] font-semibold whitespace-nowrap text-accent-ink",
          )}
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
        // Fluid: the pad spans the full content/column width at every breakpoint
        // (the dot field stretches to fill via SieveGrid). Height stays fixed per
        // breakpoint (--pad-h) so the card keeps a sensible aspect.
        className={cn(
          "relative w-full max-w-[var(--pad-maxw)] mx-[var(--pad-mx)] h-[var(--pad-h)]",
          "rounded-[var(--radius-md)] bg-[color:var(--surface-raised)] shadow-[var(--shadow-1)]",
          "border border-[color:var(--border)] cursor-crosshair touch-none overflow-hidden",
          "outline-offset-2",
          focused
            ? "outline outline-2 outline-[color:var(--focus-ring)]"
            : "outline-none",
        )}
        style={padBoxVar}
      >
        <div className="absolute inset-3">
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
        <span className={cn(EDGE, "top-[10px] left-1/2 -translate-x-1/2")}>
          {t("stronger")}
        </span>
        <span className={cn(EDGE, "bottom-[10px] left-1/2 -translate-x-1/2")}>
          {t("lighter")}
        </span>
        <span className={cn(EDGE, "left-3 top-1/2 -translate-y-1/2")}>
          {t("sweet")}
        </span>
        <span className={cn(EDGE, "right-3 top-1/2 -translate-y-1/2")}>
          {t("bright")}
        </span>
        <div
          className={cn(
            "absolute left-[var(--puck-x)] top-[var(--puck-y)] -translate-x-1/2 -translate-y-1/2",
            "h-[30px] w-[30px] rounded-full bg-brand",
            "shadow-[0_0_0_6px_var(--accent-halo),var(--shadow-1)]",
            "border-2 border-[color:var(--surface-raised)] pointer-events-none",
          )}
          style={puckVar}
        />
        <span aria-live="polite" className="sr-only">
          {summary}
        </span>
      </div>
    </div>
  );
}
