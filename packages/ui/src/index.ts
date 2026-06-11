/*
 * @crivelo/ui barrel.
 *
 * This barrel mixes two kinds of export — read each export's note:
 *
 * CANONICAL (use freely): Spinner / EmptyState / PageHeader re-export the
 * canonical composed components under `./ui/*` (added in RMP-205, also at
 * `@crivelo/ui/spinner` etc.). These have no 1:1 shadcn primitive and are the
 * supported house components.
 *
 * DEPRECATED (legacy hand-rolled): Button / Card / Input / Badge / Toast are
 * legacy hand-rolled primitives, superseded by
 * the shadcn commodity primitives under `@crivelo/ui/*` (added in RMP-200).
 * They are grandfathered so existing call sites keep working and are removed
 * once the shared-primitives migration (RMP-205/206) lands. Per-export shadcn
 * targets are noted below; do NOT import these in new code.
 */

/** @deprecated Use `@crivelo/ui/button` instead (RMP-205/206). */
export { default as Button } from "./deprecated/Button";
export type { ButtonVariant } from "./deprecated/Button";
/** @deprecated Use `@crivelo/ui/card` instead (RMP-205/206). */
export { default as Card } from "./deprecated/Card";
/** @deprecated Use `@crivelo/ui/input` (+ `@crivelo/ui/label`) instead (RMP-205/206). */
export { default as Input } from "./deprecated/Input";
/** @deprecated Use `@crivelo/ui/badge` instead (RMP-205/206). */
export { default as Badge } from "./deprecated/Badge";
export type { BadgeVariant } from "./deprecated/Badge";
/** Canonical loader (RMP-205). Also available at `@crivelo/ui/spinner`. */
export { Spinner } from "./ui/spinner";
/** Canonical empty-state panel (RMP-205). Also available at `@crivelo/ui/empty-state`. */
export { EmptyState } from "./ui/empty-state";
/** Canonical page header (RMP-205). Also available at `@crivelo/ui/page-header`. */
export { PageHeader } from "./ui/page-header";
/** @deprecated Use `@crivelo/ui/sonner` (`Toaster` + `toast()` from `sonner`) instead (RMP-205/206). */
export { ToastProvider, useToast } from "./deprecated/Toast";
