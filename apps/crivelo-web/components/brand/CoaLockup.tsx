import { CoaMark } from "./CoaMark";

/**
 * CoaLockup — the "Coa · by Crivelo" endorsement lockup, used in the header.
 *
 * Named `Lockup` in docs/design/coa-v60/project/coa-shared.jsx; renamed CoaLockup
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
  const ink = variant === "light" ? "var(--crema-50)" : "var(--fg)";
  const muted = variant === "light" ? "var(--crema-300)" : "var(--fg-3)";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color: ink,
      }}
    >
      {mono && <CoaMark px={mark} />}
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          lineHeight: 1,
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: title,
            letterSpacing: "-0.02em",
          }}
        >
          Coa
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: sub,
            color: muted,
            letterSpacing: "0.01em",
          }}
        >
          by{" "}
          <span style={{ color: ink, fontWeight: 600 }}>Crivelo</span>
        </span>
      </span>
    </div>
  );
}
