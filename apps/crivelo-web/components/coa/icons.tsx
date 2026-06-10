/**
 * Coa calculator icons (RMP-191) — the subset of the prototype's Icon set used
 * by the calculator. Ported verbatim from
 * docs/design/coa-v60/project/coa-shared.jsx (the PATHS map). Stroke icons on a
 * 24-grid, currentColor by default.
 */
import type { CSSProperties, ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  play: <path d="M7 5l11 7-11 7V5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 6.5" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  book: (
    <>
      <path d="M4 5.5A2 2 0 016 4h6v15H6a2 2 0 00-2 1.5V5.5z" />
      <path d="M20 5.5A2 2 0 0018 4h-6v15h6a2 2 0 012 1.5V5.5z" />
    </>
  ),
};

export type CoaIconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  stroke = 1.6,
  color = "currentColor",
  style,
}: {
  name: CoaIconName;
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
