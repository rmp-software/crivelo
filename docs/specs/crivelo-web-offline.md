---
slug: crivelo-web-offline
status: planned
created: 2026-06-28
tracker: local
linear_project_id:  # linear mode only
linear_parent_issue: # linear mode only
feature_branch: feature/crivelo-web-offline
---

# crivelo-web: PWA offline capability

## Context

crivelo-web ("Coa") is an installable PWA today (`@crivelo/pwa` provides manifest +
icons + iOS splash), but it has **no service worker and no offline support** — the
package is currently "installable only". Opening the installed app or any route with no
network falls back to the browser error page.

The app is uniquely well-suited to offline because it has **no backend**:

- The 4:6 recipe engine (`lib/four-six.ts`) and i18n messages (`messages/{en,pt}.json`)
  are **bundled** — no runtime fetch.
- Saved recipes (`coa-recipes`) and the last brew (`coa-last-brew`) live in
  **`localStorage`** (`lib/recipes-store.ts`) — already offline-capable, they just need
  the page to load.
- Routes are statically pre-rendered (`generateStaticParams` for `en`/`pt`).

So offline here is **purely app-shell caching**: cache the HTML shells + static assets +
the dynamically-generated PWA icon/splash routes, and all three routes (calculator,
brew, recipes) work fully offline with **zero data sync, no write queue**.

This spec covers crivelo-web only. molly's offline (cached server reads + an IndexedDB
write queue for seizure logging + background sync + conflict handling) is a separate,
much larger future spec — it will reuse the app-shell SW foundation built here.

### Decision record (forks settled during brainstorming)

- **Scope:** crivelo-web only now; molly deferred to its own spec.
- **SW tooling:** Serwist (`@serwist/turbopack`), the Next-guide-endorsed successor to
  the dead `next-pwa`. Chosen on a **Next 16 / Turbopack** base (see Phase 0) so there is
  a single bundler and the framework-blessed integration, rather than `@serwist/next`
  (webpack) which would chain a later glue migration.
- **Sequencing:** upgrade crivelo-web to Next 16 **first** (PR 1), then add offline on the
  clean 16 base (PR 2). Reason: molly is already on Next 16.2.7 (Turbopack default) while
  crivelo-web is on 15.5 (webpack default); aligning crivelo-web onto 16 removes the
  dual-bundler problem so the shared foundation has one integration shape.
- **Placement:** SW *construction* logic lives in a new shared `@crivelo/pwa/sw` entry
  (mirrors the existing `createSplashRoute` factory); only framework-convention files
  (`app/sw.ts`, the Serwist route handler, the `<SerwistProvider>`, the `next.config`
  wrapper) stay app-local. This sets molly up to reuse the foundation.

### Research basis

- Next 16 is stable (16.2.x); Turbopack is the **default** for `dev` and `build`. The
  `--webpack` opt-out survives with no announced removal date.
- `next-intl` 4.x is compatible with Next 16 + Turbopack; `createNextIntlPlugin` is
  unchanged. Issue amannn/next-intl#1779 is closed (not-planned); bump to latest 4.x to
  clear the `experimental.turbo` deprecation (amannn/next-intl#1838).
- `@serwist/turbopack` and `@serwist/next` share a **byte-identical worker core**
  (`new Serwist({...})` + `self.__SW_MANIFEST` injection token); only the glue differs —
  so the shared `createServiceWorker` core is bundler-independent.
- The hard correctness property — a new deploy busting the old precache so there is no
  `ChunkLoadError` — is what Serwist owns: content-hashed `/_next/static/...` chunks get
  `revision: null`, shells get a real revision, and `cleanupOutdatedCaches` purges the
  prior deploy's cache on activation.

Sources: [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16),
[Serwist Turbopack guide](https://serwist.pages.dev/docs/next/turbo),
[Serwist precaching](https://serwist.pages.dev/docs/serwist/guide/precaching),
[Next PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).

## Phase 0 — Next 16 upgrade (PR 1, prerequisite)

A self-contained version bump, sequenced before the SW work so offline lands on a single
bundler.

- Run `pnpm dlx @next/codemod@canary upgrade latest` and `pnpm up next-intl@latest`, then
  `next typegen` to regenerate the async `PageProps`/`RouteContext` types.
- **Async `params`** — Next 16 makes `params`/`id` Promises in image-generation functions.
  Fix every read in the next/og routes:
  - `apps/crivelo-web/app/icon.tsx`, `apps/crivelo-web/app/apple-icon.tsx`
  - `packages/pwa`'s `createSplashRoute` (`splash.tsx`) and the icon route factory — this
    reaches into the **shared package**, which must remain compatible with crema-arena
    (still on 15.5). Safe: `route.js` `params` have been Promises since Next 15, so
    `await`ing works on both versions.
- **`middleware.ts` → `proxy.ts`** rename (codemod handles it). Re-verify the next-intl
  matcher's negative-lookahead still excludes the extension-less PWA routes
  (`icon|apple-icon|pwa-icon|pwa-splash`).
- **Re-validate the splash-in-`<head>` fix on a real iOS install.** `htmlLimitedBots` is
  unchanged in Next 16, but Turbopack is a new render pipeline; the streaming-metadata
  behavior is prod-only/device-only (it is the bug that cost us the last session). Confirm
  with `document.head.querySelectorAll(...)` on a real installed PWA, not headless.
- Note: crema-arena stays on 15.5 → the monorepo runs **mixed Next versions** (fine in
  pnpm). Shared `@crivelo/*` packages must work on both; the only signature touched is
  async `params`, which is compatible across 15/16.

**Phase 0 gate:** `/manifest.webmanifest`, `/pwa-icon/{192,512,512-maskable}`,
`/pwa-splash/[size]` return correct JSON/PNGs; `/` → `/en` redirect and `/pt` resolve;
static prerender for both locales intact; splash/icon/name verified on a physical iPhone.

## Phase 1A — Shared SW foundation in `@crivelo/pwa` (PR 2)

New worker-context entry `@crivelo/pwa/sw`, kept **separate** from the existing
Node/`next/og` modules (it runs in the ServiceWorker global scope — no DOM, no Next
server imports, ServiceWorker globals only).

- `createServiceWorker({ manifest, locales, offlinePath, defaultCache })` — owns the
  Serwist instance and all logic identical across apps:
  - precache from `manifest` (`self.__SW_MANIFEST`),
  - `runtimeCaching` (incl. the dynamic icon/splash routes — see Caching strategy),
  - localized navigation `fallbacks`,
  - `cleanupOutdatedCaches`, `skipWaiting`, `clientsClaim`,
  - `serwist.addEventListeners()`.
- Thin glue helpers so each app stays ~4 small files:
  - `createCriveloSerwistRoute(...)` wrapping Serwist's `createSerwistRoute` (shared
    defaults: `swSrc`, `useNativeEsbuild`, the `additionalPrecacheEntries` builder from
    `locales` + `offlinePath`),
  - a re-exported `SerwistProvider`,
  - `withCriveloSerwist(nextConfig)` wrapping `withSerwist` with shared defaults.
- Update `packages/pwa/CLAUDE.md`: drop the "**Installable only** — no service worker, no
  offline" claim; document the `@crivelo/pwa/sw` entry, the worker-context constraint, and
  a "adding offline to a new app" checklist (for molly).
- `createServiceWorker` takes `defaultCache` by injection so the app's `app/sw.ts` imports
  the bundler-appropriate `defaultCache` (`@serwist/turbopack/worker`), keeping the
  construction logic 100% shared.

## Phase 1B — crivelo-web wiring (PR 2)

App-local glue forced by framework/file conventions:

- `apps/crivelo-web/app/sw.ts` — ~5 lines: declare `self.__SW_MANIFEST`, then call
  `createServiceWorker({ manifest: self.__SW_MANIFEST, locales: ["en", "pt"], offlinePath,
  defaultCache })` (passing the Turbopack `defaultCache`). The `self.__SW_MANIFEST`
  reference **must physically appear in this app file** (it is the injection point).
- `apps/crivelo-web/app/serwist/[path]/route.ts` — `createCriveloSerwistRoute(...)`,
  serving the SW at `/serwist/sw.js`.
- `<SerwistProvider swUrl="/serwist/sw.js">` mounted in `app/[locale]/layout.tsx`.
- `apps/crivelo-web/next.config.js` — compose `withNextIntl(withCriveloSerwist(cfg))`,
  preserving `transpilePackages` + `htmlLimitedBots`.
- A localized offline fallback page under `app/[locale]/` (statically rendered, stays
  inside normal i18n routing).
- Vercel `Cache-Control: public, max-age=0, must-revalidate` header on `/serwist/sw.js`
  (the SW must not be cached long).

## Caching strategy

- **Precache** (build manifest + explicit entries): JS/CSS/font assets (self-hosted
  `next/font` lands in `/_next/static`, auto-precached), the static `/en` and `/pt`
  shells, `/manifest.webmanifest`, and the localized offline fallback. Localized shells +
  the fallback are added via `additionalPrecacheEntries` (built from `locales`), since
  Serwist precaches build assets, not rendered HTML shells, automatically.
- **Runtime cache** the dynamic next/og routes (`/pwa-icon/*`, `/pwa-splash/*`,
  `/icon`, `/apple-icon`) with `StaleWhileRevalidate` — they are generated on the fly and
  are not in the precache manifest.
- **Navigation fallback:** the next-intl middleware does **not** run offline, so the
  `/ → /en` redirect won't fire. We precache concrete localized shells and serve a
  localized offline page for never-visited routes (rather than relying on the redirect).
- **Updates:** silent auto-update — `skipWaiting` + `clientsClaim` + `cleanupOutdatedCaches`.
  No "new version, reload" prompt for a simple calculator. A new deploy changes the SW
  bytes → install populates the new precache → activation purges the previous deploy's
  cache (no stale-chunk errors).

## Offline UX

Minimal, because the app is **fully** functional offline (nothing requires network):

- A subtle offline status indicator (informational only); no blocking offline screen on
  cached routes.
- Any genuinely network-dependent affordance (e.g. an external link out of the app, if
  present) is disabled while offline.

## Out of scope

- molly's offline (cached reads, write queue, background sync, conflict handling) — its
  own future spec, reusing this foundation.
- Push notifications / background sync APIs.
- A custom in-app "update available" prompt (silent auto-update is the chosen behavior).
- Upgrading crema-arena to Next 16 (stays on 15.5; only needs to keep building the shared
  packages).

## Acceptance criteria

- [ ] Given crivelo-web has been visited/installed online, when the device goes offline
      and the user opens the app, then the calculator (`/[locale]`), brew
      (`/[locale]/brew`), and recipes (`/[locale]/recipes`) routes all load and function.
- [ ] Given a recipe was saved while online, when the user is offline, then it still
      appears on `/[locale]/recipes` (served from `localStorage`).
- [ ] Given the user is offline, when they navigate to a route they never visited, then a
      localized offline fallback page renders (not the browser's network-error page).
- [ ] Given a new deploy ships, when the user reloads the app, then the new version loads
      with no stale-chunk (`ChunkLoadError`) errors and the old precache is purged.
- [ ] Given Phase 0 (Next 16 upgrade) has landed, when the app is installed on a real
      iPhone, then the splash screen, icons, and home-screen name still render correctly
      (no regression of the prior splash fix).
- [ ] Given the app is installed on a real iPhone, when the device is offline, then the
      app launches from the home screen and operates from cache (device-only gate).
- [ ] Given the SW is registered, when `/serwist/sw.js` is fetched, then it returns with
      `Cache-Control: public, max-age=0, must-revalidate`.

## Validation notes

- **Real-device gate:** true offline behavior on an installed iOS PWA (SW lifecycle and
  cache eviction in standalone) can only be proven on a physical device — headless
  Chromium offline tests are necessary but not sufficient, same rule as the splash work.
- Verify on `next start` (prod build) or a **bypassed** Vercel preview
  (`get_access_to_vercel_url`), never a protected preview: credential-less precache /
  manifest fetches return 401 behind deployment protection and will make offline tests lie.
- Headless coverage (Playwright/Chromium): assert SW registration, precache population,
  offline navigation to each route, and the localized offline fallback — as the fast
  pre-device gate.

## Tasks

- [x] Phase 0 — Upgrade crivelo-web to Next 16 (PR 1, prerequisite) — PR #69 (merged to feature branch; ⚠️ real-iPhone splash re-validation pending before Phase 1)
  - AC: icon/splash/manifest routes return correct PNGs/JSON; `/`→`/en` and `/pt` resolve; static prerender for both locales intact; splash + icon + home-screen name verified on a real iPhone (no regression of the prior splash fix).
  - Test: run `pnpm dlx @next/codemod@canary upgrade latest`, `pnpm up next-intl@latest`, `next typegen`; fix async `params` in `app/icon.tsx`, `app/apple-icon.tsx`, and `@crivelo/pwa` `createSplashRoute`/icon factory; rename `middleware.ts`→`proxy.ts` and confirm the matcher still excludes `icon|apple-icon|pwa-icon|pwa-splash`; `pnpm --filter crivelo-web type-check` exits 0; `next build` succeeds (Turbopack default); `next start` → curl `/manifest.webmanifest` (200 JSON), `/pwa-icon/512` + `/pwa-splash/<size>` (200 image/png), `/` 307→`/en`, `/pt` 200; on a physical iPhone reinstall, splash + home-screen name correct and `document.head.querySelectorAll('link[rel="apple-touch-startup-image"]').length > 0`.

- [x] Phase 1A — `@crivelo/pwa/sw` shared SW foundation — PR #70
  - AC: foundation supports app-shell offline with only framework-convention files left app-local; `packages/pwa/CLAUDE.md` no longer claims "no service worker".
  - Test: new `@crivelo/pwa/sw` worker-context entry exports `createServiceWorker({manifest, locales, offlinePath, defaultCache})` (Serwist instance: precache from `self.__SW_MANIFEST`, `runtimeCaching`, localized `fallbacks`, `cleanupOutdatedCaches`, `skipWaiting`/`clientsClaim`) plus glue `createCriveloSerwistRoute`, a re-exported `SerwistProvider`, and `withCriveloSerwist(nextConfig)`; entry imports no DOM/Next-server modules; `pnpm --filter @crivelo/pwa type-check` exits 0; `packages/pwa/CLAUDE.md` updated with the SW entry, the worker-context constraint, and an "add offline to a new app" checklist (for molly).

- [~] Phase 1B — crivelo-web SW wiring + offline fallback + offline UX (PR 2)
  - AC: calculator/brew/recipes all load and function offline; recipes saved online still show offline; navigating to a never-visited route offline renders a localized offline page (not the browser error page); a new deploy reloads with no `ChunkLoadError`; `/serwist/sw.js` returns `Cache-Control: public, max-age=0, must-revalidate`.
  - Test: add `app/sw.ts` (declares `self.__SW_MANIFEST`, calls `createServiceWorker`), `app/serwist/[path]/route.ts` (`createCriveloSerwistRoute`), `<SerwistProvider swUrl="/serwist/sw.js">` in `app/[locale]/layout.tsx`, `withNextIntl(withCriveloSerwist(cfg))` in `next.config.js` (keep `transpilePackages` + `htmlLimitedBots`), a localized offline page under `app/[locale]/`, and the `/serwist/sw.js` Vercel `Cache-Control` header; `next build` + `next start`; in Chromium set offline → reload → calculator, brew, recipes all render; save a recipe online, go offline, reload `/recipes` → recipe present; navigate offline to an unvisited path → localized offline page; `curl -I /serwist/sw.js` shows the cache header; a subtle offline indicator appears when offline and any external/network-only affordance is disabled offline.

- [ ] Verification gate — headless offline suite + real-iOS validation
  - AC: device-only gate — an installed iOS PWA launches and operates offline; the splash is not regressed.
  - Test: Playwright/Chromium suite asserts SW registration, precache populated, offline navigation to each of the three routes, and the localized fallback; then on a physical iPhone — install from a **bypassed** Vercel preview (`get_access_to_vercel_url`) or prod, enable Airplane mode, launch from the home screen → app opens and all three routes work from cache; splash still renders.
