/**
 * Gate for dev-only debugging affordances (e.g. the brew speed panel). These
 * surfaces must be available in local dev and on Vercel preview deploys, but
 * never reach real users on production.
 *
 * Vercel auto-exposes `NEXT_PUBLIC_VERCEL_ENV` ('production' | 'preview' |
 * 'development') to the client bundle when system env vars are exposed (the
 * default). Locally that var is absent and `NODE_ENV` is 'development'.
 */

/** Pure predicate so the gating logic is unit-testable without env juggling. */
export function isDebugEnv(
  nodeEnv: string | undefined,
  vercelEnv: string | undefined,
): boolean {
  return nodeEnv !== "production" || vercelEnv !== "production";
}

/**
 * Build-time-resolved flag (Next inlines `process.env.NODE_ENV` and
 * `NEXT_PUBLIC_*`). False only on a Vercel production deploy.
 */
export const IS_DEBUG_ENV = isDebugEnv(
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_VERCEL_ENV,
);
