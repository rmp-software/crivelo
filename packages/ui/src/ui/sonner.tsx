/*
 * shadcn/ui Sonner (Toaster) — new-york style, Tailwind v4 (shadcn CLI 4.x source).
 *
 * ADAPTATION — next-themes removed. shadcn's source reads the active theme via
 * `useTheme()` from `next-themes`. These apps do NOT use next-themes: they theme
 * by toggling a `[data-theme="dark"]` attribute on the root (see crivelo-tokens.css;
 * crema-arena is light-only). Adding next-themes just for the toaster would
 * introduce a provider these apps don't otherwise need, so we drop it and let the
 * toast inherit the HOUSE tokens directly:
 *   - The `--normal-*` CSS vars below point at the alias-layer semantic tokens
 *     (--popover / --popover-foreground / --border / --radius), which already
 *     resolve to the live house token under BOTH light and the [data-theme="dark"]
 *     override — so the toast surface follows the app theme automatically with no
 *     JS theme detection.
 *   - `theme` is a plain prop, defaulting to "system" (Sonner's own
 *     prefers-color-scheme handling) and overridable by the caller; it only steers
 *     Sonner's built-in light/dark class, while the actual colors come from the
 *     token vars above.
 * Everything else (icons, className) is verbatim. cn() is not used here.
 */
"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

const Toaster = ({ theme = "system", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// Re-export `toast` from the same sonner module instance the Toaster uses, so
// callers don't need a separate `sonner` dependency (and can't accidentally bind
// to a different copy that wouldn't reach this Toaster's queue).
export { Toaster, toast }
