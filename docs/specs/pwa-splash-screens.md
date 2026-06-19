---
slug: pwa-splash-screens
status: planned
created: 2026-06-19
tracker: local      # set by /breakdown-feature — linear | local
linear_project_id:  # linear mode only
linear_parent_issue: # linear mode only
feature_branch: mux/pwa-splash-screen
---

# PWA splash screens (iOS launch images)

## Problem

When the Crivelo PWA is installed and launched from the iOS home screen, the
cold-start window shows a blank screen until the app's first paint. Android and
desktop already auto-generate a launch screen from the web manifest
(`name` + `background_color` + a ≥512px icon — all present via `@crivelo/pwa`), so
**this gap is iOS-only**: Safari renders nothing on launch unless the app ships
`apple-touch-startup-image` link tags, one image per device geometry.

The conventional fix (a `pwa-asset-generator` matrix of committed PNGs that goes
stale every new iPhone) fights this repo's architecture. `@crivelo/pwa` already
renders icon tiles *dynamically* via `next/og` (`renderIcon` →
`app/pwa-icon/[variant]/route.tsx`). We extend that exact pattern to splash
images: no committed assets, one source of truth for the brand mark, and adding a
device is one config line.

## Goal

Show a branded full-screen launch image on iOS PWA cold-start, rendered on the fly
per device, with the generation logic living in the shared `@crivelo/pwa` package
so it is portable to other Crivelo apps (and the out-of-monorepo Molly app) by
config alone.

## Non-goals

- **No service worker / offline / install-prompt UI** — preserves the existing
  "installable-only" Molly pattern.
- **No custom in-app React splash overlay.** That covers a *different* moment
  (after first paint, not cold-start) and is a separate, deferrable feature.
- **No Android/desktop changes** — the manifest already drives their splash.
- **Molly is not wired up in this PR.** Molly lives outside the monorepo and can't
  consume the workspace package directly; this work is *design-for-portability*
  (keep all logic in `@crivelo/pwa`, app keeps a thin wrapper), so Molly can adopt
  the same pattern later by copying the wrapper + its own config.

## Visual design

White Monogram (the house sieve mark) centred on a solid **teal `#1C6E68`** field
— the same lockup as the app-icon tile.

Teal is chosen deliberately over matching the app background (`crema #FBF6EA`):
crivelo-web has light/dark theming (no-FOUC theme script in the root layout), so a
crema splash would flash wrong in dark mode. **Teal is theme-constant** — correct
under both themes — making the brand moment consistent. The minor teal→app-bg
transition as the app paints is an acceptable trade for never flashing a light
splash into a dark app.

The mark reuses the existing `mark` callback in `PwaConfig` (white at 0.16-opacity
apertures, faithful to `components/brand/Monogram.tsx`). It is scaled to the
shorter screen edge so it reads consistently across phone and tablet aspect ratios.

## Architecture

Extends the existing `@crivelo/pwa` "package owns logic, app owns App-Router
convention files" split. New/changed pieces:

### `packages/pwa/devices.ts` (new)

The canonical Apple device matrix as a set of **unique logical geometries**, keyed
by `device-width × device-height × device-pixel-ratio` (portrait points). Each
entry:

```ts
interface SplashDevice {
  id: string;      // human label, e.g. "iphone-402x874@3" — for comments/debugging
  cssW: number;    // logical width in points (portrait)
  cssH: number;    // logical height in points (portrait)
  dpr: number;     // device pixel ratio
}
```

Deduping by geometry (not marketing model) is the key simplification: iPhone 17 /
17 Pro reuse `402×874@3` (introduced by 16 Pro) and 17 Pro Max reuses `440×956@3`
(16 Pro Max), so new phones that share a geometry cost nothing. Only genuinely new
geometries are added (e.g. **iPhone Air → `420×912@3`**).

Target geometry set (portrait points @ dpr):

**iPhones**
| Geometry | Representative models |
|---|---|
| 375×667 @2 | SE (2nd/3rd), 8 |
| 414×736 @3 | 8 Plus |
| 375×812 @3 | X, XS, 11 Pro, 12/13 mini |
| 414×896 @2 | XR, 11 |
| 414×896 @3 | XS Max, 11 Pro Max |
| 390×844 @3 | 12, 12 Pro, 13, 13 Pro, 14 |
| 428×926 @3 | 12/13 Pro Max, 14 Plus |
| 393×852 @3 | 14 Pro, 15, 15 Pro, 16 |
| 430×932 @3 | 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus |
| 402×874 @3 | 16 Pro, **17**, **17 Pro** |
| 440×956 @3 | 16 Pro Max, **17 Pro Max** |
| 420×912 @3 | **iPhone Air** |

**iPads** (all @2)
| Geometry | Representative models |
|---|---|
| 768×1024 @2 | iPad mini, iPad 9.7" |
| 810×1080 @2 | iPad 10.2" |
| 820×1180 @2 | iPad 10th gen, iPad Air 11" (M2) |
| 834×1112 @2 | iPad Air/Pro 10.5" |
| 834×1194 @2 | iPad Pro 11" |
| 1024×1366 @2 | iPad Pro 12.9" |
| 1032×1376 @2 | iPad Pro 13" (M4) |

Each geometry yields **two** startup images (portrait + landscape).

### `packages/pwa/splash.tsx` (new)

```ts
export function renderSplash(
  cfg: PwaConfig,
  opts: { width: number; height: number }, // physical pixels
): ImageResponse
```

Mirrors `renderIcon`: a flex-centred `<div>` of `width × height` filled with the
splash background, containing `cfg.mark({ size, color })`. The mark size is
`Math.round(Math.min(width, height) * markScale)`. Background defaults to
`cfg.themeColor`, mark colour to white — overridable via a new optional
`splash` config block (below).

### `packages/pwa/index.ts` — `PwaConfig` extension

Add one optional block (zero required new fields; defaults give the agreed B
design):

```ts
/** iOS splash (apple-touch-startup-image) overrides. All optional. */
splash?: {
  /** Field colour. Default: themeColor. */
  background?: string;
  /** Mark colour. Default: markColor ?? "#ffffff". */
  markColor?: string;
  /** Mark size as a fraction of the shorter screen edge. Default 0.22. */
  markScale?: number;
  /** Route prefix the startup-image URLs point at. Default "/pwa-splash". */
  basePath?: string;
};
```

Export `renderSplash` and the `devices` list from the barrel.

### `packages/pwa/metadata.ts` — `pwaMetadata` extension

Extend the returned `appleWebApp` with `startupImage: AppleImage[]` built from
`devices`. For each device, emit a portrait and a landscape entry:

```ts
// portrait
{
  url: `${base}/${cssW * dpr}x${cssH * dpr}`,
  media: `(device-width: ${cssW}px) and (device-height: ${cssH}px) `
       + `and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}
// landscape — swap width/height in BOTH the URL dims and the media query
{
  url: `${base}/${cssH * dpr}x${cssW * dpr}`,
  media: `(device-width: ${cssW}px) and (device-height: ${cssH}px) `
       + `and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: landscape)`,
}
```

`base` is `cfg.splash?.basePath` (default `/pwa-splash`). The media
query uses logical points; the URL carries physical pixels so the route renders at
native resolution. (`statusBarStyle` stays `"default"`; `capable: true` is already
set, which is the prerequisite for startup images to fire on iOS.)

### `apps/crivelo-web/app/pwa-splash/[size]/route.tsx` (new)

Thin wrapper, mirrors `pwa-icon/[variant]/route.tsx`:

```ts
export const runtime = "nodejs"; // reliable ImageResponse, per @crivelo/pwa gotcha

export async function GET(_req, { params }) {
  const { size } = await params;            // e.g. "1206x2622"
  const m = /^(\d{2,5})x(\d{2,5})$/.exec(size);
  if (!m) return new Response("Not found", { status: 404 });
  const width = Number(m[1]), height = Number(m[2]);
  // guard against arbitrary huge requests (DoS): cap to the matrix's max dim
  if (width > MAX || height > MAX) return new Response("Not found", { status: 404 });
  return renderSplash(criveloPwa, { width, height });
}
```

### `apps/crivelo-web` i18n middleware matcher (change)

crivelo-web routes under `[locale]` with next-intl middleware. Per the known
`@crivelo/pwa` gotcha, the matcher 307-redirects extension-less paths — add
`pwa-splash` to the same negative-lookahead that already exempts
`icon|apple-icon|pwa-icon`, or `/pwa-splash/*` returns redirect HTML instead of
PNGs.

## Data flow

1. iOS reads `<head>` → finds the `apple-touch-startup-image` link whose `media`
   matches the launching device's geometry + orientation.
2. iOS requests that `href` → `/pwa-splash/<W>x<H>`.
3. The route parses the dims, calls `renderSplash(criveloPwa, {width, height})`.
4. `next/og` returns a PNG: white Monogram on teal at native resolution.
5. iOS paints it full-screen during cold-start, then hands off to the app.

## Edge cases & error handling

- **Unmatched geometry** (a device not in the matrix): no media query matches → iOS
  falls back to `background_color` (teal-adjacent crema). Acceptable; add the
  geometry to `devices.ts` when a new size appears.
- **Malformed / oversized `size` param** → 404 (regex + max-dimension guard).
- **Middleware redirect** → mitigated by the matcher change above; covered by an
  acceptance test asserting `image/png`, not redirect HTML.
- **Satori limitations** — the `mark` already uses literal hex (no CSS vars / web
  fonts), so the existing icon constraints carry over unchanged.

## Acceptance criteria

- [ ] Given the rendered root layout `<head>`, when inspected, then it contains an
  `apple-touch-startup-image` link for every geometry in `devices.ts` in BOTH
  orientations, each with a correct
  `device-width/device-height/-webkit-device-pixel-ratio/orientation` media query.
- [ ] Given a request to `/pwa-splash/1206x2622` (iPhone 17 portrait), when served,
  then the response is `200 image/png` with pixel dimensions exactly `1206×2622`.
- [ ] Given a request to `/pwa-splash/2622x1206` (landscape), when served, then it
  is `200 image/png` at exactly `2622×1206`.
- [ ] Given the iPhone Air geometry, when the head is inspected, then a
  `420×912 @3` portrait + landscape pair is present (the one new-in-17-family
  geometry).
- [ ] Given a malformed size (`/pwa-splash/abc` or an over-max dimension), when
  requested, then the route returns `404`.
- [ ] Given a rendered splash PNG, when opened, then the white Monogram is visible,
  centred, and legible on the teal `#1C6E68` field (Satori didn't drop the glyph).
- [ ] Given the app in either light or dark theme, when the splash renders, then it
  is teal regardless of theme.
- [ ] Given crivelo-web's i18n middleware, when `/pwa-splash/<W>x<H>` is requested,
  then it returns the PNG directly (not a `307` redirect to `/en/...`).
- [ ] Given an installed iOS PWA launched from the home screen, when it cold-starts,
  then the teal splash with the white Monogram displays before first paint
  (manual real-device verification, per the UI-change rule).
- [ ] Given any app that supplies a `PwaConfig`, when it adds the
  `pwa-splash/[size]` wrapper + the matcher exemption, then it inherits
  startup-image generation with no other per-app logic (portability check —
  verified by code inspection that no app-specific logic leaks into the wrappers).

## Testing approach

- **Unit** (`packages/pwa`): `devices.ts` → startup-image array — assert each
  geometry produces a correct portrait + landscape `{ url, media }` pair; assert
  the size→dims math (`cssW*dpr`).
- **Route** (`apps/crivelo-web`): `GET /pwa-splash/<W>x<H>` → `200 image/png` at the
  expected dimensions; malformed/oversized → `404`.
- **e2e/visual** (Playwright): assert `<head>` contains the link tags (sample a few
  geometries incl. iPhone Air); screenshot the route at one phone + one tablet size
  to confirm the mark renders centred and legible.
- **Manual**: install on a real iPhone and confirm the splash on cold-start
  (required for UI changes).

## Verification commands

`tsc --noEmit` + `next build`, then `next start` and check:
`/pwa-splash/1206x2622` and `/pwa-splash/2622x1206` (200 `image/png`, exact dims),
`/pwa-splash/bad` (404), and `<head>` contains the `apple-touch-startup-image`
links. Open a PNG to confirm the glyph rendered (Satori can silently drop
unsupported SVG). Verify locally or via a Vercel bypass cookie — a protected
preview returns `401` to credential-less image fetches.

## Tasks

- [ ] Device matrix + splash renderer in `@crivelo/pwa`
  - AC: `packages/pwa/devices.ts` holds the unique-geometry matrix (incl. iPhone Air `420×912@3`); `renderSplash(cfg, {width, height})` returns a `next/og` PNG of the white Monogram on teal at native resolution, mark scaled to the shorter edge; `PwaConfig.splash` block added (`background`/`markColor`/`markScale`/`basePath`, all optional with B-design defaults); `renderSplash` + `devices` exported from the barrel.
  - Test: `npx tsc --noEmit` exits 0. Unit test in `packages/pwa`: each geometry maps to the expected dims (`cssW*dpr`); a sample `renderSplash` call returns an `ImageResponse` of exactly the requested pixel dimensions.
- [ ] Startup-image link tags in `pwaMetadata`
  - AC: `pwaMetadata` returns `appleWebApp.startupImage[]` with a portrait AND a landscape entry per geometry; each `media` has exact `device-width`/`device-height`/`-webkit-device-pixel-ratio`/`orientation`; URLs carry physical pixels (portrait `WxH`, landscape swapped); the iPhone Air `420×912@3` pair is present.
  - Test: `npx tsc --noEmit` exits 0. Unit test: `startupImage.length === geometries × 2`; a sampled entry's `url` and `media` strings match expected verbatim.
- [ ] crivelo-web route handler + i18n middleware exemption
  - AC: `apps/crivelo-web/app/pwa-splash/[size]/route.tsx` (`runtime = "nodejs"`) parses `WxH` → `renderSplash(criveloPwa, …)`, 404s on malformed or over-max dimensions; `pwa-splash` added to the next-intl middleware matcher negative lookahead (alongside `icon|apple-icon|pwa-icon`).
  - Test: `next start`, then `GET /pwa-splash/1206x2622` → `200 image/png` at 1206×2622; `/pwa-splash/2622x1206` → 2622×1206; `/pwa-splash/bad` → 404; confirm responses are PNGs, not `307` redirects to `/en/...`.
- [ ] Whole-feature verification gate
  - AC: `next build` green; root `<head>` contains the `apple-touch-startup-image` links for every geometry in both orientations; splash renders teal in both light and dark theme; the white Monogram is centred and legible; installed iOS PWA shows the splash on cold-start.
  - Test: `npx tsc --noEmit` + `next build` exit 0. Playwright: assert head startup-image link tags (sample incl. iPhone Air) and screenshot the route at one phone + one tablet size. Manual: install on a real iPhone, confirm the splash appears on cold-start.
