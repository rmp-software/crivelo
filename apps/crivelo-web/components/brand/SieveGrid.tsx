/**
 * SieveGrid — a parametric screen of apertures.
 *
 * Two modes (ported faithfully from apps/crivelo-web/.design/project/coa-shared.jsx):
 *  - `puck` {x,y} in 0..1 lights a neighbourhood around the point (taste-pad use):
 *    each cell's `near = max(0, 1 - sqrt(dx² + dy²) * 2.4)` scales its radius and
 *    opacity, drawn in the accent.
 *  - `fill` 0..1 lights the first `round(fill * cols * rows)` cells row-major
 *    (footer motif): kept cells use the accent, the rest are faint ink.
 *
 * If both are passed, `puck` takes precedence (matches the reference).
 */
export interface SieveGridProps {
  cols?: number;
  rows?: number;
  /** Kept-dot radius in px. */
  dot?: number;
  /** Centre-to-centre spacing in px. */
  gap?: number;
  /** Empty/unfilled dot colour (ink). Defaults to `var(--fg)`. */
  color?: string;
  /** Lit-dot colour (accent). Defaults to the teal accent (`var(--brand)`). */
  accent?: string;
  /** Fill mode: 0..1 fraction of cells lit row-major. `null` disables. */
  fill?: number | null;
  /** Puck mode: {x,y} in 0..1 lights a neighbourhood. `null` disables. */
  puck?: { x: number; y: number } | null;
  /** Outer padding in px. */
  pad?: number;
  /**
   * Stretch the grid to fill its container instead of rendering at its intrinsic
   * pixel size. Used by the (fluid-width) taste pad so the dot field spans the
   * full card at every breakpoint; the viewBox still drives cell spacing.
   */
  stretch?: boolean;
}

interface Cell {
  cx: number;
  cy: number;
  on: boolean;
  near: number;
}

export function SieveGrid({
  cols = 5,
  rows = 5,
  dot = 4,
  gap = 18,
  color = "var(--fg)",
  accent = "var(--brand)",
  fill = null,
  puck = null,
  pad = 10,
  stretch = false,
}: SieveGridProps) {
  const w = pad * 2 + (cols - 1) * gap;
  const h = pad * 2 + (rows - 1) * gap;
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = pad + c * gap;
      const cy = pad + r * gap;
      let on = false;
      let near = 0;
      if (fill != null) {
        on = r * cols + c < Math.round(fill * cols * rows);
      }
      if (puck) {
        // Guard against cols/rows === 1 (division by zero → NaN → silently
        // vanishing circles). Single-axis grids collapse to the puck position.
        const dx = cols > 1 ? c / (cols - 1) - puck.x : -puck.x;
        const dy = rows > 1 ? r / (rows - 1) - puck.y : -puck.y;
        near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.4);
      }
      cells.push({ cx, cy, on, near });
    }
  }
  return (
    <svg
      width={stretch ? "100%" : w}
      height={stretch ? "100%" : h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {cells.map((cell, i) =>
        puck ? (
          <circle
            key={i}
            cx={cell.cx}
            cy={cell.cy}
            r={2 + cell.near * (dot - 1.5)}
            fill={accent}
            opacity={0.14 + cell.near * 0.86}
          />
        ) : (
          <circle
            key={i}
            cx={cell.cx}
            cy={cell.cy}
            r={cell.on ? dot : 2}
            fill={cell.on ? accent : color}
            opacity={cell.on ? 1 : 0.16}
          />
        ),
      )}
    </svg>
  );
}
