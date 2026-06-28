# CLAUDE.md — @crivelo/pwa

Shared PWA plumbing, driven by one `PwaConfig`, in two independently-importable
halves:

1. **Installability** — web app manifest + on-the-fly icon tiles (`next/og`) +
   iOS web-app meta. No install-prompt UI (matches `~/dev/molly`).
2. **Offline** — a Serwist service-worker foundation (`@serwist/turbopack` on the
   Next/Turbopack integration): the `@crivelo/pwa/sw` worker entry + the
   `@crivelo/pwa/serwist` Node glue + the `@crivelo/pwa/serwist-provider` client
   registrar. Opt-in per app — importing the installability half never pulls in
   the SW code, and vice-versa.

`serwist` + `@serwist/turbopack` + `esbuild` are **OPTIONAL peer deps**: a consumer
that only wants installability (incl. out-of-repo molly) never installs them. The
offline half is opted into by the consuming app **adding all three itself**
(`serwist`/`@serwist/turbopack` are ESM-only; `esbuild` is the native bundler the
SW build uses by default — `useNativeEsbuild: true`) — see the offline checklist.
`serwist`/`@serwist/turbopack` are devDeps here purely so this package type-checks
(`esbuild` is not imported by the package source, so it needs no devDep).

Ships raw `.ts`/`.tsx` (no build), like `@crivelo/tokens`.

Specs: `docs/specs/pwa-add-to-home-screen.md` (installability),
`docs/specs/crivelo-web-offline.md` (offline). First consumer: `apps/crivelo-web`.
crema-arena does NOT consume this package.

## What lives where
- `index.ts` — `PwaConfig` type + barrel. Read its header for the design rationale.
- `manifest.ts` — `createManifest(cfg)` → `MetadataRoute.Manifest`.
- `icon.tsx` — `renderIcon(cfg, {size, rounded, maskable})` → `ImageResponse`. The one tile renderer.
- `splash.tsx` — `renderSplash(cfg, {width, height})` → `ImageResponse` (the splash renderer) **and** `createSplashRoute(cfg)` → `{ GET }`, the factory that owns the `pwa-splash/[size]` route logic (size parsing + max-dimension guard) so the app wrapper is a one-liner.
- `devices.ts` — `splashDevices` (the unique-geometry Apple matrix) + `DEFAULT_SPLASH_BASE_PATH`.
- `metadata.ts` — `pwaMetadata(cfg)` / `pwaViewport(cfg)` → layout fragments.

### Offline (service worker) — separate import paths
- `sw.ts` (`@crivelo/pwa/sw`) — **WORKER-CONTEXT entry.** `createServiceWorker({ manifest, locales, offlinePath, defaultCache })` builds + activates the Serwist instance (precache `manifest`, `cleanupOutdatedCaches`, `skipWaiting`/`clientsClaim`, navigation preload, `runtimeCaching` = a StaleWhileRevalidate rule for the dynamic next/og routes prepended to the injected `defaultCache`, localized navigation `fallbacks`). See the worker-context constraint below.
- `serwist.ts` (`@crivelo/pwa/serwist`) — **NODE/Next context.** `createCriveloSerwistRoute({ swSrc, locales, offlinePath, ...overrides })` wraps Serwist's `createSerwistRoute` (shared `useNativeEsbuild` + the localized `additionalPrecacheEntries` built from `locales`+`offlinePath`, each shell/offline page revisioned); `withCriveloSerwist(nextConfig)` wraps `withSerwist`.
- `serwist-provider.tsx` (`@crivelo/pwa/serwist-provider`) — **CLIENT.** re-exports `SerwistProvider` (Serwist exports it from `@serwist/turbopack/react`, not the package root — apps import it from here).

#### Worker-context constraint (critical)
`@crivelo/pwa/sw` is compiled into the **service-worker global scope**. It must
import ONLY worker-safe code: the bundler-agnostic `serwist` core + its types.
NO DOM, no React, no `next/og`, no Node built-ins, and deliberately NOT
`@serwist/turbopack/worker` — the bundler-specific `defaultCache` is **injected**
by the app (a `createServiceWorker` param) so this module stays
bundler-independent. It is its own export subpath precisely so importing it never
drags in the `next/og` modules (and importing those never drags in worker code).
`offlinePath` is **locale-relative** (e.g. `"/offline"`); the package prefixes it
per locale → `/{locale}{offlinePath}` for both the precache entries and the
fallbacks (with a bounded `/{locale}` or `/{locale}/…` prefix test, never a bare
`startsWith`). The `self.__SW_MANIFEST` injection token must physically appear in
the **app's** `app/sw.ts`, not here — it is the build-time precache-manifest
replacement point. The runtime-cache matcher for the on-the-fly next/og routes
defaults to `iconBasePath: "/pwa-icon"` + `splashBasePath: "/pwa-splash"` (plus
the fixed `/icon`, `/apple-icon`); **if an app customizes `PwaConfig.iconBasePath`
or `splash.basePath`, pass the matching `iconBasePath`/`splashBasePath` to
`createServiceWorker`** or those tiles won't be runtime-cached.

The package owns the **logic**; App-Router convention files (`manifest.ts`,
`icon.tsx`, `apple-icon.tsx`, `pwa-icon/[variant]/route.tsx`) must live in the
**consuming app's `app/` tree** — they can't be exported from a package. Each app
keeps thin wrappers that call into here. See `apps/crivelo-web/app/*` for the canonical pattern.

## Adding this to a new app (checklist)
1. Add dep `"@crivelo/pwa": "workspace:*"` and add `"@crivelo/pwa"` to `next.config` **`transpilePackages`**.
2. Create `app/pwa.config.tsx`: export a `PwaConfig` with the app's name/colours and a `mark` glyph.
3. Add the wrapper files (copy crivelo-web's; they're ~5 lines each):
   `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`, `app/pwa-icon/[variant]/route.tsx`,
   `app/pwa-splash/[size]/route.tsx`.
   The splash route is now a one-line factory — the package owns the size-parsing +
   bounds-guard logic, so the wrapper is just:
   ```tsx
   export const runtime = "nodejs";
   export const { GET } = createSplashRoute(cfg);
   ```
   The `[size]` segment must be named `size` (the factory reads `params.size`).
4. In the root layout: merge `pwaMetadata(cfg)` into `metadata` (+ `manifest: "/manifest.webmanifest"`) and `export const viewport = pwaViewport(cfg)`.
5. Add `pwa-splash` (alongside `icon|apple-icon|pwa-icon`) to the i18n middleware matcher negative lookahead — see the gotcha below.
6. If the root layout's metadata is async (`async generateMetadata`, e.g. via next-intl `getTranslations`), set `htmlLimitedBots: /.*/` in `next.config` — see the streaming-metadata gotcha below. Without it the iOS splash silently breaks in **production only**.

## Adding offline to a new app (checklist) — for molly et al.
The package owns all the SW logic; an app keeps only framework-convention files.

> **PREREQUISITE (do this FIRST): the consuming app's `next.config` MUST be
> `next.config.ts` or `.mjs`, NOT CJS `next.config.js`.** `@serwist/turbopack` is
> ESM-only and `@crivelo/pwa` ships raw TS; a CJS config (`require` /
> `module.exports`) throws the moment it calls `withCriveloSerwist`. Migrate the
> config to ESM/TS before step 5. (crivelo-web ships CJS today — Phase 1B must
> migrate it.)

1. **Opt in to the SW runtime (the gate):** add `@serwist/turbopack` + `serwist` +
   `esbuild` as the app's OWN deps (all three are optional peers of `@crivelo/pwa`,
   so an installability-only app never installs them). `esbuild` is required because
   the foundation bundles the SW with native esbuild (`useNativeEsbuild: true`); a
   build without it throws `Cannot find package 'esbuild'`. (Targets lacking the
   native binary can install `esbuild-wasm` instead and pass `useNativeEsbuild: false`
   via `createCriveloSerwistRoute`'s overrides.) Also ensure `@crivelo/pwa` is in
   `next.config` **`transpilePackages`**.
2. `app/sw.ts` (~5 lines) — the WORKER source. Declare the injection token + call the factory:
   ```ts
   import { defaultCache } from "@serwist/turbopack/worker";
   import { createServiceWorker } from "@crivelo/pwa/sw";
   import type { PrecacheEntry } from "serwist";
   declare const self: ServiceWorkerGlobalScope & {
     __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
   };
   createServiceWorker({
     manifest: self.__SW_MANIFEST,
     locales: ["en", "pt"],
     offlinePath: "/offline",
     defaultCache,
   });
   ```
   `self.__SW_MANIFEST` MUST appear literally here (it is the build-time precache injection point). `defaultCache` is imported app-side (bundler-specific) and injected.
3. `app/serwist/[path]/route.ts` — serves the compiled SW at `/serwist/sw.js`:
   ```ts
   import { createCriveloSerwistRoute } from "@crivelo/pwa/serwist";
   export const { GET, generateStaticParams, dynamic, dynamicParams, revalidate } =
     createCriveloSerwistRoute({ swSrc: "app/sw.ts", locales: ["en", "pt"], offlinePath: "/offline" });
   ```
   The `[path]` segment must be named `path`. Override `useNativeEsbuild`/etc. via the spread options if a build target lacks the native esbuild binary.
4. Root layout — mount `<SerwistProvider swUrl="/serwist/sw.js">` (from `@crivelo/pwa/serwist-provider`) around the app.
5. `next.config` (already ESM/TS per the prerequisite) — compose `withCriveloSerwist` (from `@crivelo/pwa/serwist`) under the app's other plugins, e.g. `withNextIntl(withCriveloSerwist(cfg))`. Keep `transpilePackages` + `htmlLimitedBots`.
6. A localized offline page at `app/[locale]/offline/` (statically rendered, inside normal i18n routing) — matches the `offlinePath`/`locales` passed above.
7. Vercel `Cache-Control: public, max-age=0, must-revalidate` header on `/serwist/sw.js` (the SW itself must not be cached long).

## Gotchas (these bite)
- **next-intl middleware 307s the icon routes.** If the app uses i18n middleware,
  its matcher will redirect `/icon`, `/apple-icon`, `/pwa-icon/*`, `/pwa-splash/*` to `/en/...`
  (they're extension-less, so a `.*\..*` exclusion misses them) — tiles/splashes come back
  as redirect HTML, not PNGs. Add `icon|apple-icon|pwa-icon|pwa-splash` to the matcher's
  negative lookahead. `manifest.webmanifest` is safe (it has a dot).
- **Satori (next/og) can't resolve CSS variables or external fonts.** The `mark`
  callback gets a concrete hex `color` — use literal colours in the glyph SVG, never `var(--brand)`.
- **`pwa-icon/[variant]` route needs `export const runtime = "nodejs"`** for reliable `ImageResponse` under Next 14.
- **iOS splash needs the legacy `apple-mobile-web-app-capable` meta — Next 15 drops it.** iOS
  only shows `apple-touch-startup-image` when `<meta name="apple-mobile-web-app-capable" content="yes">`
  is present; `display: standalone` + the modern `mobile-web-app-capable` do NOT trigger it. Next 15
  (vercel/next.js#70363) emits only `mobile-web-app-capable` from `appleWebApp.capable`, so the splash
  silently never shows on a real install. `pwaMetadata` re-adds it via `metadata.other` — don't remove
  it. Two more iOS catches: the startup image must EXACTLY match the device geometry (it's a hard
  pixel match — a device missing from `splashDevices` gets a blank splash, not a fallback), and iOS
  reads all this **at "Add to Home Screen" time**, so after any change you must DELETE and re-add the
  home-screen icon to re-test (a stale install keeps the old head). Only validatable on a real device.
- **iOS Display Zoom ("Larger Text" / Zoomed in Settings → Display & Brightness) breaks the splash —
  by design, not a bug.** Zoom shifts the device into a NON-native logical resolution (e.g. a 15 Pro Max
  reports `375×812` instead of `430×932`), and `splashDevices` only carries native geometries. Since the
  match is a hard pixel match with no fallback, the zoomed device finds no matching `apple-touch-startup-image`
  and shows a blank splash. We deliberately do NOT enumerate the per-device zoomed resolutions (poorly
  documented, and the zoomed standalone-launch framebuffer can differ from what the Safari tab's `matchMedia`
  reports anyway). **Known limitation: the splash only renders with Display Zoom set to Standard/Default.**
  Diagnose by reading `screen.width/height` on the device — a non-native value means zoom is on.
- **Next 15 streaming metadata renders the splash tags into `<body>`, not `<head>` — iOS can't see them (PROD only).**
  Since Next 15.2, an async `generateMetadata` (e.g. a layout that `await`s next-intl `getTranslations`) is
  *streamed*: Next emits the `apple-touch-startup-image` / `apple-mobile-web-app-*` / `manifest` tags into
  `<body>` and relies on client-side hoisting into `<head>`, which Safari/iOS does NOT do. Result: tags sit in
  `<body>`, iOS finds no splash and falls back to `<title>` for the home-screen name. It works in `next dev`
  (no streaming pipeline) and in headless/desktop Chromium+WebKit — **only a real iOS install reveals it**, so
  curl/`document.querySelector` (whole-doc) hide it; check `document.head.querySelectorAll(...)` specifically.
  Fix: `htmlLimitedBots: /.*/` in `next.config` opts every UA back into blocking metadata so the tags render in
  `<head>`. Negligible TTFB cost when metadata only awaits already-loaded translations. (vercel/next.js#79313;
  this is intended Next behavior, not a bug they'll fix.)

## Verify
`tsc --noEmit` + `next build`, then `next start` and check: `GET /manifest.webmanifest`
(valid JSON, `display: "standalone"`), `/pwa-icon/{192,512,512-maskable}` (200 `image/png`,
right pixel size), `/pwa-icon/foo` → 404, and `<head>` has the manifest link + `theme-color`.
Open a tile PNG to confirm the glyph actually rendered (Satori can silently drop unsupported SVG).

**Don't trust a protected Vercel preview for icon verification.** Behind deployment
protection the manifest + icons return `401` to credential-less fetches; the page nav
carries your session so the app *name* shows, but Chrome fetches manifest icons without
credentials → blank icon. This is environmental (prod is unprotected), NOT a code bug.
Verify locally (`next start`) or on the preview via a `get_access_to_vercel_url` bypass cookie.
