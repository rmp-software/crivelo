/**
 * Coa calculator icons (RMP-191) — the subset of the prototype's Icon set used
 * by the calculator. Ported verbatim from
 * apps/crivelo-web/.design/project/coa-shared.jsx (the PATHS map). Stroke icons on a
 * 24-grid, currentColor by default.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@crivelo/ui/lib/utils";

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
  droplet: (
    <path d="M12 3.2C9 7 5.5 10 5.5 14a6.5 6.5 0 0013 0c0-4-3.5-7-6.5-10.8z" />
  ),
  chevR: <path d="M9 5l7 7-7 7" />,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  // Counter-clockwise restart arrow — the "last brew" lead glyph. Kept distinct
  // from `bookmark` (the header's saved-recipes affordance) so the last-brew bar
  // and the saved-recipes entry point don't read as the same control.
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
};

export type CoaIconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  stroke = 1.6,
  color = "currentColor",
  className,
  style,
}: {
  name: CoaIconName;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
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
      className={cn("block shrink-0", className)}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
