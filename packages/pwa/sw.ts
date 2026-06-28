/**
 * @crivelo/pwa/sw — the shared service-worker construction logic.
 *
 * THIS MODULE RUNS IN THE SERVICE-WORKER GLOBAL SCOPE. It must import only
 * worker-safe code: the bundler-agnostic `serwist` core + its types. NO DOM, no
 * React, no `next/og`, no Node built-ins, and deliberately NOT
 * `@serwist/turbopack/worker` — the bundler-specific `defaultCache` is INJECTED
 * by the app (see `defaultCache` param) so this file stays bundler-independent
 * and the construction logic is 100% shared across apps (crivelo-web today,
 * molly tomorrow).
 *
 * The app's own `app/sw.ts` is the only place that touches framework glue: it
 * declares `self.__SW_MANIFEST` (the precache-manifest injection token Serwist
 * replaces at build time), imports the Turbopack `defaultCache`, and calls
 * `createServiceWorker` — ~5 lines, no logic.
 */
import { Serwist, StaleWhileRevalidate } from "serwist";
import type {
  HandlerDidErrorCallbackParam,
  PrecacheEntry,
  PrecacheFallbackEntry,
  RouteMatchCallback,
  RuntimeCaching,
} from "serwist";

/** Default manifest-icon route prefix (matches `PwaConfig.iconBasePath` default). */
const DEFAULT_ICON_BASE_PATH = "/pwa-icon";
/** Default splash route prefix (matches `DEFAULT_SPLASH_BASE_PATH` in devices.ts). */
const DEFAULT_SPLASH_BASE_PATH = "/pwa-splash";

export interface CreateServiceWorkerOptions {
  /**
   * The precache manifest — pass the app's `self.__SW_MANIFEST` (Serwist injects
   * the build's content-hashed asset list here; `undefined` only in dev before
   * injection). Content-hashed `/_next/static/*` chunks arrive with
   * `revision: null` so they are deduped, not re-cache-busted.
   */
  manifest: (PrecacheEntry | string)[] | undefined;
  /**
   * The app's locale codes (e.g. `["en", "pt"]`). Drives the per-locale
   * navigation fallbacks so an offline document request lands on the offline
   * page for its own locale.
   */
  locales: string[];
  /**
   * Locale-RELATIVE path of the offline fallback page (e.g. `"/offline"`). The
   * worker prefixes it per locale → `/{locale}{offlinePath}`. The matching
   * precache entries are added app-side via `createCriveloSerwistRoute`.
   */
  offlinePath: string;
  /**
   * The bundler-specific default caching strategies, injected by the app from
   * `@serwist/turbopack/worker`'s `defaultCache`. Kept a parameter so this
   * worker module never imports the bundler package.
   */
  defaultCache: RuntimeCaching[];
  /**
   * Manifest-icon route prefix to runtime-cache, matching the app's
   * `PwaConfig.iconBasePath`. Default `"/pwa-icon"`. Override if the app
   * customizes it, or the icon tiles won't be runtime-cached.
   */
  iconBasePath?: string;
  /**
   * Splash route prefix to runtime-cache, matching the app's
   * `PwaConfig.splash?.basePath`. Default `"/pwa-splash"`.
   */
  splashBasePath?: string;
}

/** Runtime cache for the on-the-fly next/og PWA asset routes. */
const DYNAMIC_PWA_ASSET_CACHE = "crivelo-pwa-dynamic-assets";

/**
 * Bounded locale-prefix test: a pathname belongs to `locale` only if it is
 * exactly `/{locale}` or sits under `/{locale}/`. A bare `startsWith` would
 * wrongly claim `/enterprise` for "en" or `/ptsd` for "pt".
 */
function matchesLocale(pathname: string, locale: string): boolean {
  return pathname === `/${locale}` || pathname.startsWith(`/${locale}/`);
}

/**
 * The dynamic PWA routes (the configurable `iconBasePath`/`splashBasePath`, the
 * fixed Next file-convention routes `/icon`, `/apple-icon`, and the generated
 * `/manifest.webmanifest`) are produced per request and are NOT in the precache
 * manifest, so they need an explicit runtime rule. Without the manifest rule, an
 * offline document load re-requesting `<link rel="manifest">` logs a network
 * error. Same-origin only.
 */
function makeDynamicPwaAssetMatcher(
  iconBasePath: string,
  splashBasePath: string
): RouteMatchCallback {
  return ({ url, sameOrigin }) =>
    sameOrigin &&
    (url.pathname.startsWith(`${iconBasePath}/`) ||
      url.pathname.startsWith(`${splashBasePath}/`) ||
      url.pathname === "/icon" ||
      url.pathname === "/apple-icon" ||
      url.pathname === "/manifest.webmanifest");
}

/**
 * Build one offline-page fallback per locale (a document request under
 * `/{locale}` that misses cache falls back to that locale's offline page) plus a
 * catch-all on the first locale for document requests with NO recognised locale
 * prefix — e.g. `/`, the installed app's launch URL when an app keeps a bare-`/`
 * start_url, which the next-intl middleware would normally redirect to
 * `/{defaultLocale}` but the middleware does NOT run offline.
 *
 * The catch-all resolves to the default-locale **shell** (`/{locales[0]}`), NOT
 * the offline page: an unlocalized document request structurally means "the app at
 * the default locale", so offline it should open the app (the shell is precached),
 * not a dead-route screen. The offline page stays reserved for genuinely unknown
 * locale-PREFIXED routes (`/{locale}/never-visited`). The catch-all matcher
 * explicitly EXCLUDES every known locale prefix so it never shadows a localized
 * entry regardless of Serwist's match-iteration order.
 */
function offlineFallbackEntries(
  locales: string[],
  offlinePath: string
): PrecacheFallbackEntry[] {
  const isDocument = (param: HandlerDidErrorCallbackParam): boolean =>
    param.request.destination === "document";
  const pathOf = (param: HandlerDidErrorCallbackParam): string =>
    new URL(param.request.url).pathname;

  const entries: PrecacheFallbackEntry[] = locales.map((locale) => ({
    url: `/${locale}${offlinePath}`,
    matcher: (param) => isDocument(param) && matchesLocale(pathOf(param), locale),
  }));

  if (locales.length > 0) {
    entries.push({
      // Default-locale SHELL (precached), not the offline page — an unlocalized
      // document request ("/") should open the app offline, not the fallback.
      url: `/${locales[0]}`,
      matcher: (param) =>
        isDocument(param) &&
        !locales.some((locale) => matchesLocale(pathOf(param), locale)),
    });
  }

  return entries;
}

/**
 * Construct, wire, and activate the Serwist service worker. Owns every behaviour
 * identical across apps:
 * - precache the build manifest (`manifest`),
 * - `cleanupOutdatedCaches` so a new deploy purges the prior deploy's precache
 *   on activation (no stale-chunk `ChunkLoadError`),
 * - `skipWaiting` + `clientsClaim` for silent auto-update,
 * - navigation preload,
 * - `runtimeCaching`: the dynamic next/og routes (StaleWhileRevalidate) FIRST so
 *   they win over `defaultCache`'s broader rules, then the injected
 *   `defaultCache`,
 * - localized navigation `fallbacks` serving the per-locale offline page for
 *   `request.destination === "document"`.
 *
 * Then registers the event listeners. Returns the instance for the (rare) app
 * that wants to add its own listeners — but it is already fully wired.
 */
export function createServiceWorker(
  options: CreateServiceWorkerOptions
): Serwist {
  const {
    manifest,
    locales,
    offlinePath,
    defaultCache,
    iconBasePath = DEFAULT_ICON_BASE_PATH,
    splashBasePath = DEFAULT_SPLASH_BASE_PATH,
  } = options;

  const serwist = new Serwist({
    precacheEntries: manifest,
    precacheOptions: { cleanupOutdatedCaches: true },
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
      {
        matcher: makeDynamicPwaAssetMatcher(iconBasePath, splashBasePath),
        handler: new StaleWhileRevalidate({
          cacheName: DYNAMIC_PWA_ASSET_CACHE,
        }),
      },
      ...defaultCache,
    ],
    fallbacks: { entries: offlineFallbackEntries(locales, offlinePath) },
  });

  serwist.addEventListeners();

  return serwist;
}
