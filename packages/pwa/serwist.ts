/**
 * @crivelo/pwa/serwist — Node/Next-context glue around `@serwist/turbopack`.
 *
 * These helpers run in the NORMAL Next server/build context (NOT the worker
 * scope — that is `@crivelo/pwa/sw`). They wrap Serwist's Turbopack integration
 * with the shared Crivelo defaults so each consuming app keeps only the
 * framework-forced convention files (the `serwist/[path]` route handler and the
 * `next.config` wrapper) as thin one-liners.
 *
 * Mirrors the `createSplashRoute` factory precedent: the package owns the wiring
 * that is identical across apps; the app supplies only its config (locales,
 * offline path, the SW source path).
 */
import { createSerwistRoute, withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

/** The full option object Serwist's `createSerwistRoute` accepts. */
type SerwistRouteOptions = Parameters<typeof createSerwistRoute>[0];

/**
 * A single precache manifest entry. Shaped to match `@serwist/build`'s
 * `ManifestEntry` structurally so we never need to import that transitive
 * package just for a 2-field type.
 */
interface PrecacheManifestEntry {
  url: string;
  revision: string;
}

export interface CreateCriveloSerwistRouteOptions
  extends Omit<Partial<SerwistRouteOptions>, "swSrc"> {
  /** Path to the app's `app/sw.ts` (e.g. `"app/sw.ts"`), relative to cwd. */
  swSrc: string;
  /** The app's locale codes (e.g. `["en", "pt"]`). */
  locales: string[];
  /** Locale-RELATIVE offline page path (e.g. `"/offline"`). */
  offlinePath: string;
  /**
   * Revision stamped on the precached HTML shells + offline pages. Server-
   * rendered HTML is not content-hashed, so it needs an explicit revision to
   * bust on a new deploy. Defaults to `NEXT_DEPLOYMENT_ID` (Vercel's stable
   * per-deployment id) and falls back to a per-build timestamp off-platform —
   * override only if you have a better build id.
   */
  revision?: string;
}

/**
 * Revision stamped on the HTML shells + offline pages. Prefer Vercel's stable
 * per-deployment id (`NEXT_DEPLOYMENT_ID`) so an immediate retry deploy of the
 * SAME build does not needlessly re-precache every shell; fall back to a
 * per-build timestamp when it is absent (local/non-Vercel). Evaluated once per
 * `next build`, so all entries in a build share it and a new deploy gets a new
 * one — the "bust the shell on deploy, dedupe within a build" property.
 */
const BUILD_REVISION =
  process.env.NEXT_DEPLOYMENT_ID ?? Date.now().toString(36);

/**
 * The static HTML shells + offline pages Serwist cannot discover from the build
 * manifest (it precaches build ASSETS, not rendered HTML routes). One localized
 * app shell (`/{locale}`) and one localized offline page (`/{locale}{offlinePath}`)
 * per locale, each stamped with `revision`.
 */
function offlinePrecacheEntries(
  locales: string[],
  offlinePath: string,
  revision: string
): PrecacheManifestEntry[] {
  return locales.flatMap((locale) => [
    { url: `/${locale}`, revision },
    { url: `/${locale}${offlinePath}`, revision },
  ]);
}

/**
 * Build the App-Router export object for an app's `app/serwist/[path]/route.ts`,
 * serving the compiled SW at `/serwist/sw.js`. Wraps `createSerwistRoute` with
 * the shared defaults (`useNativeEsbuild`, the localized
 * `additionalPrecacheEntries`) so the app's route file is one line:
 *
 * ```ts
 * export const { GET, generateStaticParams, dynamic, dynamicParams, revalidate } =
 *   createCriveloSerwistRoute({ swSrc: "app/sw.ts", locales: ["en", "pt"], offlinePath: "/offline" });
 * ```
 *
 * Most fields can be overridden via the spread-through options (overrides win),
 * EXCEPT `additionalPrecacheEntries`: the package's locale shells + offline pages
 * are always kept and MERGED with any the app supplies, so an app passing its own
 * (or `undefined`) can never wipe out the offline shells.
 */
export function createCriveloSerwistRoute({
  swSrc,
  locales,
  offlinePath,
  revision = BUILD_REVISION,
  ...overrides
}: CreateCriveloSerwistRouteOptions): ReturnType<typeof createSerwistRoute> {
  return createSerwistRoute({
    swSrc,
    // Bundle the SW with native esbuild (faster; the Vercel/CI build is Linux).
    // `esbuild` is a peer of @serwist/turbopack; flip to `false` (esbuild-wasm)
    // via overrides if a target lacks the native binary.
    useNativeEsbuild: true,
    // Overrides applied BEFORE additionalPrecacheEntries so they cannot clobber
    // the package's offline shells — those are merged in last, unconditionally.
    ...overrides,
    additionalPrecacheEntries: [
      ...offlinePrecacheEntries(locales, offlinePath, revision),
      ...(overrides.additionalPrecacheEntries ?? []),
    ],
  });
}

/**
 * Wrap a Next config with Serwist's Turbopack integration. The shared seam where
 * SW-related next-config defaults live for every Crivelo app — today a thin pass
 * through `withSerwist`; centralized so apps don't each call `withSerwist`
 * directly (and so a future shared default lands in one place). Compose under
 * the app's other plugins, e.g. `withNextIntl(withCriveloSerwist(cfg))`.
 */
export function withCriveloSerwist(nextConfig?: NextConfig): NextConfig {
  return withSerwist(nextConfig);
}
