import { Monogram } from "./Monogram";

/**
 * CriveloLockup — the HOUSE lockup: the sieve Monogram + the "Crivelo" wordmark.
 *
 * Used in shell chrome (nav, footer) where the HOUSE is the subject. Neutral ink;
 * the `light` variant swaps to cream ink for dark surfaces.
 *
 * Ported faithfully from apps/crivelo-web/.design/project/coa-shared.jsx (size table,
 * gap, wordmark in `var(--font-display)` 700, letter-spacing -0.02em).
 */
export type LockupSize = "sm" | "md" | "lg";
export type LockupVariant = "dark" | "light";

export interface CriveloLockupProps {
  /** Preset scale. */
  size?: LockupSize;
  /** `dark` = neutral ink on light surfaces; `light` = cream ink on dark. */
  variant?: LockupVariant;
}

const SIZES: Record<LockupSize, [mono: number, font: number]> = {
  sm: [20, 17],
  md: [26, 22],
  lg: [36, 29],
};

export function CriveloLockup({
  size = "md",
  variant = "dark",
}: CriveloLockupProps) {
  const [mono, font] = SIZES[size];
  const ink = variant === "light" ? "var(--crema-50)" : "var(--fg)";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color: ink,
      }}
    >
      <Monogram px={mono} color={ink} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: font,
          letterSpacing: "-0.02em",
        }}
      >
        Crivelo
      </span>
    </div>
  );
}
