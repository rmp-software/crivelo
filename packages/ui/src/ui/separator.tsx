/*
 * shadcn/ui Separator — new-york style, Tailwind v4 (shadcn CLI 4.x source).
 *
 * Verbatim new-york Separator EXCEPT the cn() import: shadcn emits `@/lib/utils`,
 * rewritten to the relative shared util (no `@/` alias). Radix Separator from the
 * unified `radix-ui` package. `bg-border` resolves through the alias layer.
 */
"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
