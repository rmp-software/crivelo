/**
 * Minimal shell icons (RMP-190) — the subset of the prototype's Icon set used by
 * the shell controls. Ported verbatim from apps/crivelo-web/.design/project/coa-shared.jsx
 * (the PATHS map). Stroke icons on a 24-grid, currentColor by default.
 */
import type { CSSProperties, ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 9.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  stroke = 1.6,
  color = "currentColor",
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
