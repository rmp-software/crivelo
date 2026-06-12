/*
 * Spinner — canonical loader (no 1:1 shadcn primitive).
 *
 * The brand "concentric rings" loader: three nested rings whose top edge is
 * tinted with FOUNDATION tokens only, so it resolves (and adapts) in every app
 * — not just crema. The accent (outer) ring is `--brand`, which each app
 * overrides (cinnamon in crema, teal in crivelo-web), so the spinner picks up
 * the host app's accent automatically. The two inner rings use neutral
 * foundation tokens (espresso/crema family) for concentric contrast. NO
 * arena-only tokens (cinnamon/marigold/gold) — those live in arena-tokens.css
 * and would render transparent rings anywhere else.
 *
 * The rings rotate at three different speeds with the middle one reversed (the
 * brand cadence), via Tailwind v4 arbitrary utilities on the built-in `spin`
 * keyframe — no inline `style`, no raw hex, no hand-authored `@keyframes`.
 */
import * as React from "react"

import { cn } from "../lib/utils"

type SpinnerSize = "sm" | "md" | "lg"

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-6",
  md: "size-10",
  lg: "size-16",
}

function Spinner({
  size = "md",
  className,
  variant = "dark",
  ...props
}: Omit<React.ComponentProps<"div">, "ref"> & {
  size?: SpinnerSize
  /** Use the inverse palette for dark backgrounds (espresso surfaces). */
  variant?: "dark" | "light"
}) {
  // Two NEUTRAL rings from the foundation (espresso/crema family). On dark
  // surfaces use light neutrals; on light surfaces use ink neutrals. All four
  // tokens (--crema-200/-50, --fg-muted/--fg-3) are declared in
  // @crivelo/tokens/styles/foundation.css, so they resolve in every app.
  const middleColor =
    variant === "light"
      ? "border-t-crema-200"
      : "border-t-fg-muted"
  const innerColor =
    variant === "light"
      ? "border-t-crema-50"
      : "border-t-fg-3"

  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Carregando"
      className={cn("relative inline-block", sizeClasses[size], className)}
      {...props}
    >
      {/* Outer ring — accent (--brand: cinnamon in crema, teal in crivelo) */}
      <span className="absolute inset-0 animate-[spin_1.4s_linear_infinite] rounded-full border-2 border-transparent border-t-brand" />
      {/* Middle ring — neutral, reversed + slower (the brand cadence) */}
      <span
        className={cn(
          "absolute inset-[16%] animate-[spin_2.1s_linear_infinite_reverse] rounded-full border-2 border-transparent",
          middleColor
        )}
      />
      {/* Inner ring — neutral, slowest */}
      <span
        className={cn(
          "absolute inset-[32%] animate-[spin_3.2s_linear_infinite] rounded-full border-2 border-transparent",
          innerColor
        )}
      />
    </div>
  )
}

export { Spinner }
