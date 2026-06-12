import type { CSSProperties } from "react";
import { CoaMark } from "./CoaMark";

/**
 * CoaLockup — the "Coa · by Crivelo" endorsement lockup, used in the header.
 *
 * Named `Lockup` in apps/crivelo-web/.design/project/coa-shared.jsx; renamed CoaLockup
 * here. Pairs the Coa V60 mark (teal tool) with the "Coa" wordmark and a muted
 * "by Crivelo" endorsement — the house endorses the tool. Set `mono={false}` to
 * drop the leading mark.
 *
 * Ported faithfully (size table, gaps, fonts). The reference's leading mark is the
 * house Monogram; in the locked header design the tool's own CoaMark sits beside
 * "Coa · by Crivelo" (see screens/nav.png + screens/coamark.png), so CoaMark is
 * used here.
 */
export type CoaLockupSize = "sm" | "md" | "lg";
export type CoaLockupVariant = "dark" | "light";

export interface CoaLockupProps {
  /** Preset scale. */
  size?: CoaLockupSize;
  /** `dark` = neutral ink on light surfaces; `light` = cream ink on dark. */
  variant?: CoaLockupVariant;
  /** Render the leading Coa mark. */
  mono?: boolean;
}

const SIZES: Record<CoaLockupSize, [mark: number, title: number, sub: number]> = {
  sm: [20, 17, 10],
  md: [26, 22, 11],
  lg: [38, 32, 13],
};

export function CoaLockup({
  size = "md",
  variant = "dark",
  mono = true,
}: CoaLockupProps) {
  const [mark, title, sub] = SIZES[size];
  // last-resort: runtime font sizes only
  const vars = {
    "--title-size": `${title}px`,
    "--sub-size": `${sub}px`,
  } as CSSProperties;
  return (
    <div
      style={vars}
      className={
        "inline-flex items-center gap-[10px] " +
        (variant === "light" ? "text-[color:var(--crema-50)]" : "text-[color:var(--fg)]")
      }
    >
      {mono && <CoaMark px={mark} />}
      <span className="inline-flex flex-col gap-0.5 leading-none">
        <span className="font-display text-[length:var(--title-size)] font-bold tracking-[-0.02em]">
          Coa
        </span>
        <span
          className={
            "font-body text-[length:var(--sub-size)] tracking-[0.01em] " +
            (variant === "light" ? "text-[color:var(--crema-300)]" : "text-[color:var(--fg-3)]")
          }
        >
          by{" "}
          <span
            className={
              "font-semibold " +
              (variant === "light" ? "text-[color:var(--crema-50)]" : "text-[color:var(--fg)]")
            }
          >
            Crivelo
          </span>
        </span>
      </span>
    </div>
  );
}
