/*
 * @crivelo/ui barrel — the HAND-ROLLED primitives.
 *
 * @deprecated as a set. Every export below is a legacy hand-rolled primitive,
 * superseded by the shadcn commodity primitives under `@crivelo/ui/ui/*` (added in
 * RMP-200). They are grandfathered so existing call sites keep working and are
 * removed once the shared-primitives migration (RMP-205/206) lands. Per-export
 * shadcn targets are noted below; do NOT import these in new code.
 */

/** @deprecated Use `@crivelo/ui/ui/button` instead (RMP-205/206). */
export { default as Button } from "./Button";
export type { ButtonVariant } from "./Button";
/** @deprecated Use `@crivelo/ui/ui/card` instead (RMP-205/206). */
export { default as Card } from "./Card";
/** @deprecated Use `@crivelo/ui/ui/input` (+ `@crivelo/ui/ui/label`) instead (RMP-205/206). */
export { default as Input } from "./Input";
/** @deprecated Use `@crivelo/ui/ui/badge` instead (RMP-205/206). */
export { default as Badge } from "./Badge";
export type { BadgeVariant } from "./Badge";
/** @deprecated No 1:1 shadcn primitive — compose a spinner from lucide `Loader2` + `animate-spin` (RMP-205/206). */
export { default as LoadingSpinner } from "./LoadingSpinner";
/** @deprecated No 1:1 shadcn primitive — compose from `@crivelo/ui/ui/card` + typography utilities (RMP-205/206). */
export { default as EmptyState } from "./EmptyState";
/** @deprecated Use `@crivelo/ui/ui/dialog` instead (RMP-205/206). */
export { default as Modal } from "./Modal";
/** @deprecated No 1:1 shadcn primitive — compose from typography utilities + `@crivelo/ui/ui/button` (RMP-205/206). */
export { default as PageHeader } from "./PageHeader";
/** @deprecated Use `@crivelo/ui/ui/alert-dialog` instead (RMP-205/206). */
export { default as ConfirmationModal } from "./ConfirmationModal";
/** @deprecated Use `@crivelo/ui/ui/sonner` (`Toaster` + `toast()` from `sonner`) instead (RMP-205/206). */
export { ToastProvider, useToast } from "./Toast";
