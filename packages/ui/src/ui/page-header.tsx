/*
 * PageHeader — canonical composed component (no 1:1 shadcn primitive).
 *
 * A page-level header: an optional breadcrumb nav, a display title + optional
 * description, and an actions slot (compose `@crivelo/ui/button` here). Styled
 * with the house semantic tokens via arbitrary utility classNames (no inline
 * `style`, no raw hex) and `cn()` — see the @crivelo/ui styling contract.
 */
import * as React from "react"

import { cn } from "../lib/utils"

type Breadcrumb = { label: string; href?: string }

function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: Breadcrumb[]
}) {
  return (
    <div
      data-slot="page-header"
      className={cn("mb-6 md:mb-8", className)}
      {...props}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-[var(--fg-3)]">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="transition-colors hover:text-[var(--brand)]"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-[var(--fg-2)]">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="mb-2 font-display text-3xl font-bold text-[var(--fg)] md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-base text-[var(--fg-2)] md:text-lg">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 md:gap-3">{actions}</div>
        )}
      </div>
    </div>
  )
}

export { PageHeader }
