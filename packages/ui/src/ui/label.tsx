/*
 * shadcn/ui Label — new-york style, Tailwind v4 (shadcn CLI 4.x source).
 *
 * Verbatim new-york Label EXCEPT the cn() import: shadcn emits `@/lib/utils`,
 * rewritten to the relative shared util (no `@/` alias in this package). Radix
 * Label is imported from the unified `radix-ui` package (mirrors button.tsx).
 */
"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
