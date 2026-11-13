/*
 * EmptyState — canonical composed component (no 1:1 shadcn primitive).
 *
 * A centered empty/zero-data panel: optional icon in a soft disc, a title, an
 * optional description, and an optional primary action (rendered via the
 * canonical `@crivelo/ui/button`). Styled with the house semantic tokens via
 * arbitrary utility classNames (no inline `style`, no raw hex) and `cn()`.
 */
import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "action"> & {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div
      data-slot="empty-state"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-4 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-bg-2 p-4" aria-hidden="true">
          <Icon size={48} className="text-fg-3" />
        </div>
      )}
      <h3 className="mb-2 font-display text-xl font-semibold text-fg-2">
        {title}
      </h3>
      {description && (
        // The bottom margin is the gap to the action, so it exists only when
        // there is an action below to be separated from. Unconditional, it left
        // every action-less panel (a search that found nothing; an empty list
        // whose "create" flow does not exist yet) bottom-heavy, and consumers
        // reaching in with `[&_p]:mb-0` to undo it.
        <p className={cn("max-w-md text-fg-3", action && "mb-6")}>
          {description}
        </p>
      )}
      {action && (
        // `default` is the canonical primary — equivalent to the deprecated
        // EmptyState's `variant="primary"` (crema aliases --primary → --brand).
        // Stated explicitly so the intent doesn't depend on shadcn's default.
        <Button variant="default" onClick={action.onClick} aria-label={action.label}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
