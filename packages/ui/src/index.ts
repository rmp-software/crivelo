/*
 * @crivelo/ui barrel.
 *
 * CANONICAL (use freely): Spinner / EmptyState / PageHeader re-export the
 * canonical composed components under `./ui/*` (added in RMP-205, also at
 * `@crivelo/ui/spinner` etc.). These have no 1:1 shadcn primitive and are the
 * supported house components.
 */

/** Canonical loader (RMP-205). Also available at `@crivelo/ui/spinner`. */
export { Spinner } from "./ui/spinner";
/** Canonical empty-state panel (RMP-205). Also available at `@crivelo/ui/empty-state`. */
export { EmptyState } from "./ui/empty-state";
/** Canonical page header (RMP-205). Also available at `@crivelo/ui/page-header`. */
export { PageHeader } from "./ui/page-header";
