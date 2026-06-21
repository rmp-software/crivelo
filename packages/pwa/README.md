# `@crivelo/pwa`

Shared "add to home screen" plumbing for Crivelo apps. It encapsulates the
Molly-proven PWA setup — a web app manifest, on-the-fly icon tiles and iOS
launch images via `next/og`, and the iOS web-app `<head>` meta — so any app
becomes installable by supplying **one config object**: a name, a few colours,
and a brand glyph.

**Installable only.** No service worker, no offline caching, no install-prompt
UI. The result is a launcher entry that opens the app `display: standalone`
(app-like chrome) instead of a browser shortcut.

The package owns the **logic**; Next's App Router file conventions
(`manifest.ts`, `icon.tsx`, `route.tsx`, …) have to live in the consuming app's
`app/` tree, so each app keeps a handful of **thin wrapper files** that call into
this package. `apps/crivelo-web/app/*` is the canonical reference.

> This package ships **raw `.ts`/`.tsx`** (no build step), like
> `@crivelo/tokens`. Consuming apps must add `"@crivelo/pwa"` to `next.config`
> `transpilePackages` (covered in Getting started).

## Contents

- [Getting started (single-locale)](#getting-started-single-locale)
- [API reference](#api-reference)
  - [`PwaConfig`](#pwaconfig)
  - [`createManifest`](#createmanifest)
  - [`createManifestRoute`](#createmanifestroute)
  - [`renderIcon`](#rendericon)
  - [`renderSplash`](#rendersplash)
  - [`createSplashRoute`](#createsplashroute)
  - [`pwaMetadata`](#pwametadata)
  - [`pwaViewport`](#pwaviewport)
  - [`splashDevices`](#splashdevices)
  - [`DEFAULT_SPLASH_BASE_PATH`](#default_splash_base_path)
  - [`SplashDevice`](#splashdevice)
- [Locale-aware manifest](#locale-aware-manifest)
- [Gotchas](#gotchas)

---

## Getting started (single-locale)

The simplest path: a single-locale, installable PWA. (For a bilingual app where
each locale is a distinct installable app, do this first, then layer on the
[Locale-aware manifest](#locale-aware-manifest) section.)

### 1. Author a `PwaConfig`

Create `app/pwa.config.tsx` — the single source of truth for the manifest and
the icon/splash tiles. Supply the app name, the two manifest colours, and a
`mark` callback that renders the brand glyph.

```tsx
// app/pwa.config.tsx
import type { PwaConfig } from "@crivelo/pwa";

// The brand glyph. It is rendered by next/og's Satori, which CANNOT resolve CSS
// variables or external fonts — so the callback receives a concrete hex `color`
// and the SVG must use LITERAL colours only (never `var(--brand)`). Likewise the
// config colours below are literal hex, not design-token utilities.
function BrandMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx={32} cy={32} r={28} fill={color} />
    </svg>
  );
}

export const myPwa: PwaConfig = {
  name: "My App",
  description: "What the app does, in the default locale.",
  lang: "en",
  themeColor: "#1C6E68", // manifest theme_color + viewport theme-color + tile bg
  backgroundColor: "#FBF6EA", // manifest background_color (splash behind the icon)
  mark: ({ size, color }) => <BrandMark size={size} color={color} />,
};
```

See [`PwaConfig`](#pwaconfig) for every field and its default.

### 2. Add `@crivelo/pwa` to `transpilePackages`

The package ships raw `.ts`/`.tsx`, so Next must transpile it:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@crivelo/pwa"],
};

module.exports = nextConfig;
```

### 3. Add the thin App Router wrapper files

These files must live in `app/` because they are Next file conventions — they
can't be exported from a package. Each is ~5 lines and just wires `myPwa` into a
package function.

**`app/manifest.ts`** — the web app manifest, served at `/manifest.webmanifest`:

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";
import { createManifest } from "@crivelo/pwa";
import { myPwa } from "./pwa.config";

export default function manifest(): MetadataRoute.Manifest {
  return createManifest(myPwa);
}
```

**`app/icon.tsx`** — the browser favicon, served at `/icon` (rounded tile):

```tsx
// app/icon.tsx
import { renderIcon } from "@crivelo/pwa";
import { myPwa } from "./pwa.config";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(myPwa, { size: 32, rounded: true });
}
```

**`app/apple-icon.tsx`** — the iOS home-screen icon, served at `/apple-icon`
(full-bleed; iOS masks it to a rounded square automatically):

```tsx
// app/apple-icon.tsx
import { renderIcon } from "@crivelo/pwa";
import { myPwa } from "./pwa.config";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(myPwa, { size: 180, maskable: true });
}
```

**`app/pwa-icon/[variant]/route.tsx`** — the three manifest icon tiles the
manifest references (`192`, `512`, `512-maskable`). The `nodejs` runtime keeps
`next/og`'s `ImageResponse` rendering reliable:

```tsx
// app/pwa-icon/[variant]/route.tsx
import { renderIcon } from "@crivelo/pwa";
import { myPwa } from "../../pwa.config";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  switch (variant) {
    case "192":
      return renderIcon(myPwa, { size: 192, rounded: true });
    case "512":
      return renderIcon(myPwa, { size: 512, rounded: true });
    case "512-maskable":
      return renderIcon(myPwa, { size: 512, maskable: true });
    default:
      return new Response("Not found", { status: 404 });
  }
}
```

**`app/pwa-splash/[size]/route.tsx`** — the iOS launch images
(`apple-touch-startup-image`). This one is a single-line factory: the package
owns the size-parsing and bounds-guard logic. The `[size]` segment **must** be
named `size` (the factory reads `params.size`), and you must declare the
`runtime` export yourself — Next reads it as a static literal from the route
module, so the factory can't supply it:

```tsx
// app/pwa-splash/[size]/route.tsx
import { createSplashRoute } from "@crivelo/pwa";
import { myPwa } from "../../pwa.config";

export const runtime = "nodejs";
export const { GET } = createSplashRoute(myPwa);
```

> **i18n middleware exemption.** If the app runs an i18n middleware (e.g.
> next-intl), its matcher will 307-redirect the extension-less asset routes
> (`/icon`, `/apple-icon`, `/pwa-icon/*`, `/pwa-splash/*`) into `/en/...`, so
> tiles and splashes come back as redirect HTML instead of PNGs. Add
> `icon|apple-icon|pwa-icon|pwa-splash` to the matcher's negative lookahead so
> they are served at the root. `manifest.webmanifest` is safe (it has a dot).
> See [Gotchas](#gotchas).

### 4. Wire the root layout

Spread `pwaMetadata(myPwa)` into the layout's exported `metadata`, set
`manifest: "/manifest.webmanifest"`, and export `pwaViewport(myPwa)` as
`viewport`:

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { pwaMetadata, pwaViewport } from "@crivelo/pwa";
import { myPwa } from "./pwa.config";

export const metadata: Metadata = {
  title: "My App",
  description: "What the app does.",
  manifest: "/manifest.webmanifest",
  ...pwaMetadata(myPwa),
};

export const viewport: Viewport = pwaViewport(myPwa);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

That's it — the app is installable. Verify with `next build && next start`:
`GET /manifest.webmanifest` is valid JSON with `display: "standalone"`;
`/pwa-icon/{192,512,512-maskable}` return `200 image/png` at the right pixel
size; `/pwa-icon/foo` is a `404`; and the document `<head>` has the manifest
link plus a `theme-color`.

---

## API reference

Every export is a pure function of a `PwaConfig` (plus, in a couple of cases, a
small options object or a locale). Code snippets reflect the current signatures;
note that route handlers take **async** `params` (`Promise<…>`), per Next 15.

### `PwaConfig`

The single config object that drives the whole package. Apps build one and pass
it to every function.

```ts
interface PwaConfig {
  name: string;
  shortName?: string;
  description: string;
  lang: string;
  themeColor: string;
  backgroundColor: string;
  mark: (opts: { size: number; color: string }) => ReactElement;
  markColor?: string;
  iconScale?: number;
  radiusScale?: number;
  iconBasePath?: string;
  splash?: {
    background?: string;
    markColor?: string;
    markScale?: number;
    basePath?: string;
  };
  i18n?: {
    locales: Record<
      string,
      {
        description: string;
        lang: string;
        dir?: "ltr" | "rtl";
        startUrl?: string;
      }
    >;
  };
}
```

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `string` | — | Manifest `name` + `applicationName` + iOS web-app title. |
| `shortName` | `string?` | `name` | Manifest `short_name`. |
| `description` | `string` | — | Manifest `description`, in the app's default-locale string. |
| `lang` | `string` | — | Manifest `lang` (e.g. `"en"`). |
| `themeColor` | `string` (hex) | — | Manifest `theme_color` + viewport theme-color + the icon-tile background. |
| `backgroundColor` | `string` (hex) | — | Manifest `background_color` (the splash field behind the icon). |
| `mark` | `(opts) => ReactElement` | — | The brand glyph for the icon tile, rendered `markColor` on `themeColor`. **Satori (next/og) cannot resolve CSS variables or external fonts** — the callback receives a concrete hex `color` and the glyph must use literal colours only. |
| `markColor` | `string?` (hex) | `"#ffffff"` | Glyph colour on the tile. |
| `iconScale` | `number?` | `0.54` | Glyph size as a fraction of the tile. |
| `radiusScale` | `number?` | `0.29` | Corner radius as a fraction of the tile (rounded tiles only). |
| `iconBasePath` | `string?` | `"/pwa-icon"` | Manifest icon `src` prefix. |
| `splash.background` | `string?` (hex) | `themeColor` | iOS launch-image field colour. |
| `splash.markColor` | `string?` (hex) | `cfg.markColor ?? "#ffffff"` | iOS launch-image mark colour. |
| `splash.markScale` | `number?` | `0.22` | Launch-image mark size as a fraction of the shorter screen edge. |
| `splash.basePath` | `string?` | `DEFAULT_SPLASH_BASE_PATH` (`"/pwa-splash"`) | Route prefix the startup-image URLs point at. |
| `i18n` | `object?` | — | Opt-in locale-aware manifest data — see [Locale-aware manifest](#locale-aware-manifest). Omit for single-locale apps; the package never imports an i18n library. |
| `i18n.locales` | `Record<string, {...}>` | — | Per-locale overrides, keyed by the route's `[locale]` segment. List every locale you serve (incl. the default). A locale absent here falls back to the top-level fields. |
| `i18n.locales[].description` | `string` | — | Localized manifest `description`. |
| `i18n.locales[].lang` | `string` | — | BCP-47 manifest `lang` (e.g. `"en"`, `"pt-BR"`). |
| `i18n.locales[].dir` | `"ltr" \| "rtl"?` | `"ltr"` | Manifest `dir`. |
| `i18n.locales[].startUrl` | `string?` | `/${locale}` | The `200` `start_url` for this locale. |

### `createManifest`

```ts
function createManifest(cfg: PwaConfig, locale?: string): MetadataRoute.Manifest
```

Builds a web app manifest object from a `PwaConfig`. Backs `app/manifest.ts` (no
locale) and, via `createManifestRoute`, the per-locale `manifest/[locale]` route.

- **`createManifest(cfg)`** (no locale) → the non-localized manifest:
  `start_url: "/"`, no `id`, no `dir`, top-level `description`/`lang`. This is the
  single-locale behaviour and stays byte-identical to the pre-i18n output.
- **`createManifest(cfg, locale)`** where `cfg.i18n.locales[locale]` exists → a
  per-locale manifest with a `200` `start_url` (`locales[locale].startUrl` or
  `/${locale}`), a distinct `id` (= the `start_url`, so each locale is a separate
  installable app), and that locale's `lang`/`dir`/`description`.
- **`createManifest(cfg, locale)`** where `cfg.i18n` is absent, or the locale is
  not declared in `cfg.i18n.locales` → degrades to the non-localized manifest
  (never a broken manifest).

Icons are always the three tiles served by `pwa-icon/[variant]` (`192` + `512`
`"any"`, `512` `"maskable"`), prefixed with `cfg.iconBasePath`. An empty
`startUrl: ""` falls back to `/${locale}` (uses `||`, not `??`, so an empty
string never produces a broken `""`).

**Returns** a `MetadataRoute.Manifest` (Next serializes it; the file-convention
route also handles the correct content type).

### `createManifestRoute`

```ts
function createManifestRoute(cfg: PwaConfig): {
  GET: (req: Request, ctx: { params: Promise<{ locale: string }> }) => Promise<Response>;
};
```

The route factory for an app's `manifest/[locale]` route — the locale-aware
sibling of `createSplashRoute`. It owns all the route logic (locale lookup +
i18n-aware status decision + serialization), so the app's route file is just
`export const { GET } = createManifestRoute(cfg)`. The dynamic segment **must**
be named `locale`; the factory reads `params.locale` as a plain string (no
i18n-library import — the app supplies the locale set via `cfg.i18n`).

**Status policy:**

- `cfg.i18n` configured but the locale is **not** in `cfg.i18n.locales` → `404`.
  (Uses `Object.hasOwn`, so inherited prototype keys like `"toString"` don't
  bypass the guard.)
- `cfg.i18n` **absent** (the route is wired but no locales declared) → serves the
  non-localized `createManifest(cfg)`. A misconfig degrades to "works, not
  localized", never a `404`.
- otherwise → the localized `createManifest(cfg, locale)`.

A known/served response carries `Content-Type: application/manifest+json` (the
MIME type the spec mandates).

**Returns** `{ GET }` only. A `runtime` export, if the app needs one, is the app
wrapper's job — Next reads it as a static literal from the route module, so it
can't be returned from a factory.

### `renderIcon`

```ts
function renderIcon(cfg: PwaConfig, opts: {
  size: number;
  rounded?: boolean;
  maskable?: boolean;
}): ImageResponse
```

Renders a single PWA icon tile via `next/og`: the brand glyph (`markColor`)
centred on a solid `themeColor` square. The one tile renderer behind
`icon.tsx`, `apple-icon.tsx`, and `pwa-icon/[variant]/route.tsx`.

- `size` — the tile size in px (square).
- `rounded` — apply the corner radius (`radiusScale`). For browser/Android tiles.
- `maskable` — full-bleed tile, no corner radius — for the iOS apple-icon and the
  manifest's `maskable` tile. `maskable` always wins over `rounded`: the platform
  crops a maskable tile under its own mask, so it must stay full-bleed; the glyph
  stays inside the safe zone by virtue of `iconScale` (≈0.54).

The glyph size is `round(size * iconScale)`; the corner radius (when applicable)
is `round(size * radiusScale)`.

**Returns** an `ImageResponse` (which extends `Response`, so a route can return
it directly).

### `renderSplash`

```ts
function renderSplash(cfg: PwaConfig, opts: {
  width: number;
  height: number;
}): ImageResponse
```

Renders a single iOS launch image (`apple-touch-startup-image`) via `next/og`:
the brand mark centred on a solid background filling `width × height` **physical
pixels**. Mirrors `renderIcon`, but the canvas is a full-screen rectangle (not a
square tile) and the mark is scaled to the **shorter** edge (`markScale` ≈ 0.22)
so it reads consistently across phone/tablet aspect ratios and both orientations.

- `width` / `height` — image dimensions in **physical** pixels (`cssW*dpr` or
  `cssH*dpr`).

Background defaults to `cfg.splash?.background ?? cfg.themeColor`; mark colour to
`cfg.splash?.markColor ?? cfg.markColor ?? "#ffffff"`. Backs the app's
`pwa-splash/[size]` route (usually via `createSplashRoute` rather than directly).

**Returns** an `ImageResponse`.

### `createSplashRoute`

```ts
function createSplashRoute(cfg: PwaConfig): {
  GET: (req: Request, ctx: { params: Promise<{ size: string }> }) => Promise<Response>;
};
```

The route factory for an app's `pwa-splash/[size]` route. The package owns all
the route logic (size parsing + a max-dimension bounds guard + render), so the
app's route file is just `export const { GET } = createSplashRoute(cfg)`. The
dynamic segment **must** be named `size` (the factory reads `params.size`).

- Parses the `size` param as `WxH` physical pixels (e.g. `"1206x2622"`). A
  malformed param → `404`.
- Bounds the request to the largest physical dimension any device in
  `splashDevices` can request (a cheap DoS guard against arbitrary huge sizes).
  Out of bounds → `404`.
- Otherwise → `renderSplash(cfg, { width, height })`.

**Returns** `{ GET }` only. Declare `export const runtime = "nodejs"` in the
route file yourself — Next requires the runtime export to be a static literal it
reads at build time, so the factory can't supply it.

### `pwaMetadata`

```ts
function pwaMetadata(cfg: PwaConfig): Metadata
```

A `Metadata` fragment to spread into the App Router root layout's exported
`metadata`. It sets:

- `applicationName` (= `cfg.name`),
- `appleWebApp` — iOS web-app capability, the title, status-bar style, and the
  full `startupImage` set (two `apple-touch-startup-image` link tags per device
  geometry in `splashDevices`),
- `formatDetection: { telephone: false }` (so phone numbers in copy aren't
  auto-linked in standalone mode), and
- `other["apple-mobile-web-app-capable"] = "yes"` — the legacy meta iOS
  **requires** for `apple-touch-startup-image` splashes to show. Next 15 dropped
  the apple-prefixed tag (it emits only `mobile-web-app-capable`), which silently
  breaks the iOS splash; this re-adds it. Don't remove it.

Spread it alongside the app's own `title`/`description` and `manifest`.

### `pwaViewport`

```ts
function pwaViewport(cfg: PwaConfig): Viewport
```

A `Viewport` fragment to export as the layout's `viewport`. Sets `themeColor` (=
`cfg.themeColor`) plus sane mobile defaults: `width: "device-width"`,
`initialScale: 1`, `maximumScale: 5`, `userScalable: true`.

### `splashDevices`

```ts
const splashDevices: SplashDevice[]
```

The canonical Apple device matrix for iOS `apple-touch-startup-image` link tags
— a set of **unique logical geometries** keyed by
`device-width × device-height × device-pixel-ratio` (portrait points), not by
marketing model. Deduping by geometry is the key simplification: phones that
reuse an existing W×H×DPR triple cost nothing (e.g. iPhone 17 / 17 Pro reuse the
16 Pro's `402×874@3`); only a genuinely new geometry earns a new entry.

Each entry yields **two** startup images downstream (portrait + landscape). Used
by `pwaMetadata` (to emit the link tags) and `renderSplash`/`createSplashRoute`
(the route renders at the physical pixel size, `cssW*dpr × cssH*dpr`). Most apps
never touch this directly.

### `DEFAULT_SPLASH_BASE_PATH`

```ts
const DEFAULT_SPLASH_BASE_PATH: "/pwa-splash"
```

The default value for `cfg.splash?.basePath` — the route path the
startup-image URLs point at. Override `cfg.splash.basePath` only if you serve the
splash route from a different path.

### `SplashDevice`

```ts
interface SplashDevice {
  id: string;   // human label, e.g. "iphone-402x874@3" — for comments/debugging
  cssW: number; // logical width in points (portrait)
  cssH: number; // logical height in points (portrait)
  dpr: number;  // device pixel ratio
}
```

The shape of a `splashDevices` entry. Exported as a type for apps that need to
reason about the matrix (rare).

---

## Locale-aware manifest

For a bilingual app, a single static `/manifest.webmanifest` with `start_url:
"/"` is an anti-pattern: `/` 307-redirects to the active locale (a redirecting
`start_url` can suppress or flash the iOS splash on cold launch), and a
Portuguese user's installed app still declares English metadata. The
locale-aware path gives each locale its own manifest with a `200` `start_url`, a
localized `description`/`lang`/`dir`, and a distinct `id` — so installing from
`/pt` yields a Portuguese app launching at `/pt`.

It is **fully opt-in and i18n-library-free**: the app (the only place that knows
its locale set) passes locale data down as plain config via `cfg.i18n`; the
package reads the `[locale]` route param as a plain string. Apps without
`cfg.i18n` change nothing — `createManifest(cfg)` stays byte-identical.

### 1. Add the `i18n` block to your `PwaConfig`

```tsx
// app/pwa.config.tsx
export const myPwa: PwaConfig = {
  name: "Crivelo", // a proper noun — name/short_name stay constant, not localized
  description: "Tools for people who live coffee.", // default-locale fallback
  lang: "en",
  themeColor: "#1C6E68",
  backgroundColor: "#FBF6EA",
  mark: ({ size, color }) => <CriveloMonogram size={size} color={color} />,
  // The top-level description/lang above stay the bare /manifest.webmanifest
  // fallback; these localize the installed app per locale.
  i18n: {
    locales: {
      en: { description: "Tools for people who live coffee.", lang: "en" },
      pt: { description: "Ferramentas para quem vive café.", lang: "pt-BR" },
    },
  },
};
```

List every locale you serve, including the default. Each entry can also set
`dir` (default `"ltr"`) and `startUrl` (default `/${locale}`).

### 2. Add the per-locale manifest route

```ts
// app/manifest/[locale]/route.ts
import { createManifestRoute } from "@crivelo/pwa";
import { myPwa } from "../../pwa.config";

export const runtime = "nodejs";
export const { GET } = createManifestRoute(myPwa);
```

Served at `/manifest/en`, `/manifest/pt`. The `[locale]` segment **must** be
named `locale`. The factory returns `200` with
`Content-Type: application/manifest+json` for a known locale, `404` for an
unknown locale when `i18n` is configured, and the non-localized manifest when
`i18n` is absent. See [`createManifestRoute`](#createmanifestroute).

### 3. Exempt `manifest` from the i18n middleware matcher

Add `manifest` to the matcher's negative lookahead (alongside the icon/splash
asset routes) so `/manifest/*` is served at the root rather than 307'd into the
locale prefix:

```ts
// middleware.ts
export const config = {
  matcher:
    "/((?!_next|_vercel|(?:icon|apple-icon|pwa-icon|pwa-splash|manifest)(?:/|$)|.*\\..*).*)",
};
```

### 4. Point the layout's `manifest` link at the per-locale URL

`generateMetadata` already has the locale, so this is plain string
interpolation — no new dependency. It replaces the static
`manifest: "/manifest.webmanifest"`:

```tsx
// app/[locale]/layout.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: /* … */,
    manifest: `/manifest/${locale}`,
    ...pwaMetadata(myPwa),
  };
}
```

### Gotcha — do NOT keep a static `app/manifest.ts`

This is the one that bites. Next's `manifest` file convention auto-emits
`<link rel="manifest" href="/manifest.webmanifest">` into the head, and that link
**overrides** the layout's `metadata.manifest`. So if you keep `app/manifest.ts`,
the head link stays pinned to the non-localized `/manifest.webmanifest` for every
locale and the feature does nothing. **Remove `app/manifest.ts`** so
`metadata.manifest: /manifest/${locale}` owns the head link.

To keep the bare URL alive for clients that cached it at install time, redirect
it to the default-locale manifest in `next.config.js`:

```js
// next.config.js
async redirects() {
  return [
    {
      source: "/manifest.webmanifest",
      destination: "/manifest/en", // default locale
      permanent: false, // 307: a back-compat shim, not a canonical relocation
    },
  ];
}
```

The next-intl middleware matcher excludes dotted paths, so
`/manifest.webmanifest` isn't intercepted by i18n routing.

iOS metadata in `pwaMetadata` (the web-app title, the startup-image links) is
**unchanged** by all of this: the title is a constant proper noun and the startup
images are device-based, not locale-based.

> `apps/crivelo-web` is the worked example for every step above
> (`app/pwa.config.tsx`, `app/manifest/[locale]/route.ts`, `middleware.ts`,
> `app/[locale]/layout.tsx`, `next.config.js`).

---

## Gotchas

These bite — most are only fully validatable on a real device.

- **i18n middleware 307s the asset routes.** The icon/splash routes are
  extension-less, so a `.*\..*` matcher exclusion misses them and they get
  redirected to `/en/...` (tiles come back as redirect HTML, not PNGs). Add
  `icon|apple-icon|pwa-icon|pwa-splash` (and `manifest` for the locale-aware
  manifest) to the matcher's negative lookahead. `manifest.webmanifest` is safe
  (it has a dot).
- **Satori (next/og) can't resolve CSS variables or external fonts.** The `mark`
  callback gets a concrete hex `color` — use literal colours in the glyph SVG,
  never `var(--brand)`. Open a rendered tile PNG to confirm the glyph actually
  appeared (Satori can silently drop unsupported SVG).
- **`pwa-icon/[variant]` (and the splash/manifest routes) need
  `export const runtime = "nodejs"`** for reliable `ImageResponse` rendering. The
  factories can't supply it — Next reads it as a static literal from the route
  module.
- **iOS needs the legacy `apple-mobile-web-app-capable` meta — Next 15 drops it.**
  iOS only shows `apple-touch-startup-image` when that meta is present;
  `display: standalone` and the modern `mobile-web-app-capable` do **not** trigger
  it. `pwaMetadata` re-adds it via `metadata.other` — don't remove it.
- **iOS startup images are an exact pixel match.** A device geometry missing from
  `splashDevices` gets a blank splash, not a fallback. iOS reads the head at "Add
  to Home Screen" time, so after any change you must **delete and re-add** the
  home-screen icon (and, for cold-launch splash behaviour, reboot the phone) to
  re-test.
- **Don't trust a protected Vercel preview for icon verification.** Behind
  deployment protection the manifest + icons return `401` to credential-less
  fetches, so Chrome shows a blank icon even though the app name resolves. This is
  environmental (prod is unprotected), not a code bug — verify locally
  (`next start`) or via a Vercel access-bypass cookie.
