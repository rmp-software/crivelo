/**
 * CoaMark — the TOOL mark for Coa.
 *
 * A V60 pour-over cone: an inverted triangle with ribs converging to the apex,
 * plus a drip below. Carries the site's teal accent (`var(--brand)`) — distinct
 * from the neutral house sieve.
 *
 * Ported faithfully from apps/crivelo-web/.design/project/coa-shared.jsx (the cone
 * path "M13 14.5 L51 14.5 L32 47 Z", the two converging ribs at 0.42 opacity,
 * and the drip path). The stroke/fill render in `currentColor` — callers drive the
 * teal accent with a `text-brand` utility (the reference's `var(--coa)`).
 */
import { cn } from "@crivelo/ui/lib/utils";

export interface CoaMarkProps {
  /** Rendered width/height in px (square). */
  px?: number;
  /** Extra classes — set the stroke/fill colour via a `text-*` utility (the marks
   * use `currentColor`); the Coa tool mark is teal, so callers pass `text-brand`. */
  className?: string;
}

export function CoaMark({ px = 26, className }: CoaMarkProps) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("block shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M13 14.5 L51 14.5 L32 47 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 14.5 L32 47 M40 14.5 L32 47"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M32 50.5 C 28.6 54, 28.6 58.2, 32 58.2 C 35.4 58.2, 35.4 54, 32 50.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
