/**
 * Monogram — the Crivelo HOUSE mark.
 *
 * A 5×5 sieve (screen of apertures); the kept/solid dots spell a "C". Neutral
 * ink by default (`var(--fg)`) — the house wears no product accent.
 *
 * Ported faithfully from apps/crivelo-web/.design/project/coa-shared.jsx (grid array,
 * column/row centres c=[8,20,32,44,56], kept r=4 / empty r=2, opacity 1 / 0.16).
 */
export interface MonogramProps {
  /** Rendered width/height in px (square). */
  px?: number;
  /** Dot colour. Defaults to neutral ink (`var(--fg)`). */
  color?: string;
}

const GRID: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 1, 1, 0],
];

const C = [8, 20, 32, 44, 56];

export function Monogram({ px = 26, color = "var(--fg)" }: MonogramProps) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      className="block shrink-0"
      aria-hidden="true"
    >
      {GRID.flatMap((row, r) =>
        row.map((on, k) => (
          <circle
            key={`${r}-${k}`}
            cx={C[k]}
            cy={C[r]}
            r={on ? 4 : 2}
            fill={color}
            opacity={on ? 1 : 0.16}
          />
        )),
      )}
    </svg>
  );
}
