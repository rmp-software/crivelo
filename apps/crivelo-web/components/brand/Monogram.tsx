import { cn } from "@crivelo/ui/lib/utils";

/**
 * Monogram — the Crivelo HOUSE mark.
 *
 * A 5×5 sieve (screen of apertures); the kept/solid dots spell a "C". The dots
 * render in `currentColor` — drive the colour with a `text-*` utility (the house
 * wears no product accent; it inherits the surrounding ink by default).
 *
 * Ported faithfully from apps/crivelo-web/.design/project/coa-shared.jsx (grid array,
 * column/row centres c=[8,20,32,44,56], kept r=4 / empty r=2, opacity 1 / 0.16).
 */
export interface MonogramProps {
  /** Rendered width/height in px (square). */
  px?: number;
  /** Extra classes — set the dot colour via a `text-*` utility (the fills use
   * `currentColor`). Omit to inherit the surrounding ink. */
  className?: string;
}

const GRID: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 1, 1, 0],
];

const C = [8, 20, 32, 44, 56];

export function Monogram({ px = 26, className }: MonogramProps) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      className={cn("block shrink-0", className)}
      aria-hidden="true"
    >
      {GRID.flatMap((row, r) =>
        row.map((on, k) => (
          <circle
            key={`${r}-${k}`}
            cx={C[k]}
            cy={C[r]}
            r={on ? 4 : 2}
            fill="currentColor"
            opacity={on ? 1 : 0.16}
          />
        )),
      )}
    </svg>
  );
}
