# CLAUDE.md — @crivelo/pwa

Shared "add to home screen" plumbing: web app manifest + on-the-fly icon tiles
(`next/og`) + iOS web-app meta, driven by one `PwaConfig`. **Installable only** —
no service worker, no offline, no install-prompt UI (matches `~/dev/molly`).
Ships raw `.ts`/`.tsx` (no build), like `@crivelo/tokens`.

Spec: `docs/specs/pwa-add-to-home-screen.md`. First consumer: `apps/crivelo-web`.

## What lives where
- `index.ts` — `PwaConfig` type + barrel. Read its header for the design rationale.
- `manifest.ts` — `createManifest(cfg)` → `MetadataRoute.Manifest`.
- `icon.tsx` — `renderIcon(cfg, {size, rounded, maskable})` → `ImageResponse`. The one tile renderer.
- `splash.tsx` — `renderSplash(cfg, {width, height})` → `ImageResponse` (the splash renderer) **and** `createSplashRoute(cfg)` → `{ GET }`, the factory that owns the `pwa-splash/[size]` route logic (size parsing + max-dimension guard) so the app wrapper is a one-liner.
- `devices.ts` — `splashDevices` (the unique-geometry Apple matrix) + `DEFAULT_SPLASH_BASE_PATH`.
- `metadata.ts` — `pwaMetadata(cfg)` / `pwaViewport(cfg)` → layout fragments.

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

## Gotchas (these bite)
- **next-intl middleware 307s the icon routes.** If the app uses i18n middleware,
  its matcher will redirect `/icon`, `/apple-icon`, `/pwa-icon/*`, `/pwa-splash/*` to `/en/...`
  (they're extension-less, so a `.*\..*` exclusion misses them) — tiles/splashes come back
  as redirect HTML, not PNGs. Add `icon|apple-icon|pwa-icon|pwa-splash` to the matcher's
  negative lookahead. `manifest.webmanifest` is safe (it has a dot).
- **Satori (next/og) can't resolve CSS variables or external fonts.** The `mark`
  callback gets a concrete hex `color` — use literal colours in the glyph SVG, never `var(--brand)`.
- **`pwa-icon/[variant]` route needs `export const runtime = "nodejs"`** for reliable `ImageResponse` under Next 14.

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
