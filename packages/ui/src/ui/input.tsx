/*
 * shadcn/ui Input — new-york style, Tailwind v4 (shadcn CLI 4.x source).
 *
 * Verbatim new-york Input EXCEPT the cn() import: shadcn emits `@/lib/utils`,
 * rewritten to the relative shared util (this package has no `@/` alias). The
 * semantic utilities (border-input, bg-transparent, text-foreground,
 * placeholder:text-muted-foreground, ring-ring, …) resolve through the alias
 * layer in ../styles/shadcn-theme.css to the house tokens.
 */
import * as React from "react"

import { cn } from "../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
