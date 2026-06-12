import type { CSSProperties } from "react";
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
  const inkColor = variant === "light" ? "var(--crema-50)" : "var(--fg)";
  // last-resort: runtime font sizes only
  const vars = {
    "--wordmark-size": `${font}px`,
  } as CSSProperties;
  return (
    <div
      style={vars}
      className={
        "inline-flex items-center gap-2.5 " +
        (variant === "light" ? "text-crema-50" : "text-fg")
      }
    >
      <Monogram px={mono} color={inkColor} />
      <span className="font-display text-[length:var(--wordmark-size)] font-bold tracking-[-0.02em]">
        Crivelo
      </span>
    </div>
  );
}
