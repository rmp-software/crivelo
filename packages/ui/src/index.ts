/*
 * @crivelo/ui barrel — the HAND-ROLLED primitives.
 *
 * @deprecated as a set. Every export below is a legacy hand-rolled primitive,
 * superseded by the shadcn commodity primitives under `@crivelo/ui/*` (added in
 * RMP-200). They are grandfathered so existing call sites keep working and are
 * removed once the shared-primitives migration (RMP-205/206) lands. Per-export
 * shadcn targets are noted below; do NOT import these in new code.
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
/** @deprecated No 1:1 shadcn primitive — compose a spinner from lucide `Loader2` + `animate-spin` (RMP-205/206). */
export { default as LoadingSpinner } from "./deprecated/LoadingSpinner";
/** @deprecated No 1:1 shadcn primitive — compose from `@crivelo/ui/card` + typography utilities (RMP-205/206). */
export { default as EmptyState } from "./deprecated/EmptyState";
/** @deprecated Use `@crivelo/ui/dialog` instead (RMP-205/206). */
export { default as Modal } from "./deprecated/Modal";
/** @deprecated No 1:1 shadcn primitive — compose from typography utilities + `@crivelo/ui/button` (RMP-205/206). */
export { default as PageHeader } from "./deprecated/PageHeader";
/** @deprecated Use `@crivelo/ui/alert-dialog` instead (RMP-205/206). */
export { default as ConfirmationModal } from "./deprecated/ConfirmationModal";
/** @deprecated Use `@crivelo/ui/sonner` (`Toaster` + `toast()` from `sonner`) instead (RMP-205/206). */
export { ToastProvider, useToast } from "./deprecated/Toast";
