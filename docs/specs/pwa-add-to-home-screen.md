---
slug: pwa-add-to-home-screen
status: draft
created: 2026-06-11
linear_project_id:
linear_parent_issue:
feature_branch:
---

<feature_specification>

  <feature_name>PWA: Add to Home Screen (@crivelo/pwa + crivelo-web)</feature_name>

  <overview>
    Make Crivelo apps installable to a phone/desktop home screen with a correct
    app icon, name, and theme colour — the "add to home screen" experience. The
    work has two parts: (1) a new shared package `@crivelo/pwa` that encapsulates
    web-app-manifest construction and on-the-fly icon-tile rendering, so any app
    in the monorepo can wire up installability by supplying only its name,
    colours, and brand glyph; and (2) the first consumer, `apps/crivelo-web`
    (the Crivelo hub), wired up with the Crivelo Monogram mark (the house sieve-C, not Coa's tool cone).

    Modelled directly on the proven setup in `~/dev/molly` (app-local
    `manifest.ts` + `icon.tsx` + `apple-icon.tsx` + `pwa-icon/[variant]` route,
    all rendering tiles via `next/og`'s `ImageResponse`). The difference: Molly
    hardcodes its paw glyph and colours into every file; here that logic moves
    into `@crivelo/pwa` and each app passes a small config object.
  </overview>

  <problem>
    crivelo-web has no manifest, no icons, and no iOS web-app meta. Saving it to
    a home screen yields a generic screenshot tile with the URL as the label —
    not a branded, app-like launcher entry. We also expect Crema Arena and future
    apps to need the same capability, so copy-pasting Molly's four files per app
    (and per brand glyph) would drift. A shared module makes installability a
    one-config-object decision per app and keeps the tile-rendering rules
    (sizes, safe-zone, corner radius, maskable bleed) in one place.
  </problem>

  <scope>
    <in_scope>
      - New package `@crivelo/pwa` (ships raw `.ts`/`.tsx` source, no build step,
        like `@crivelo/tokens`): manifest builder + icon-tile renderer + layout
        metadata/viewport fragment helpers.
      - crivelo-web wired up as the first consumer using the Crivelo Monogram (house sieve-C) mark
        (`var(--brand)` teal `#1C6E68` on crema, white glyph on a teal tile).
      - App-local thin files in crivelo-web: `app/manifest.ts`, `app/icon.tsx`,
        `app/apple-icon.tsx`, `app/pwa-icon/[variant]/route.tsx`, and a shared
        `app/pwa.config.tsx` holding the Crivelo config + Monogram mark.
      - iOS web-app + theme-colour metadata merged into the `[locale]` root layout.
    </in_scope>
    <out_of_scope>
      - Service worker / offline caching / precaching. (Installable only —
        matches Molly. No SW is registered.)
      - Any "Add to Home Screen" prompt UI / banner / `beforeinstallprompt`
        component. Users install via the browser's native share/menu.
      - Wiring Crema Arena (or other apps) — the package is built to enable it,
        but only crivelo-web is implemented here. Crema Arena already has its own
        static `icon.png`/`apple-icon.png`; migrating it is a separate task.
      - Localised manifest. A Web App Manifest is a single file with no
        per-locale `description` field, so we cannot translate the install-prompt
        copy without a separate locale-keyed manifest route. We deliberately
        accept English as the forced default (the app's `defaultLocale` is `en`):
        the manifest uses `name`/`short_name` "Crivelo" (a proper noun, never
        translated) and `description` "Tools for people who live coffee." This is
        a conscious, accepted break with the pt-BR-UI-copy rule for this one OS
        surface — `pt` visitors will see the English `description` in their
        install prompt. Revisit with a `/[locale]/manifest.webmanifest` route if
        that becomes a problem.
    </out_of_scope>
  </scope>

  <surfaces_affected>
    - `packages/pwa/package.json` — new (`@crivelo/pwa`, private workspace pkg)
    - `packages/pwa/manifest.ts` — new (`createManifest`)
    - `packages/pwa/icon.tsx` — new (`renderIcon` tile renderer)
    - `packages/pwa/metadata.ts` — new (`pwaMetadata` / `pwaViewport` fragments)
    - `packages/pwa/index.ts` — new (barrel + shared `PwaConfig` type)
    - `apps/crivelo-web/package.json` — modified (add `@crivelo/pwa: workspace:*`)
    - `apps/crivelo-web/app/pwa.config.tsx` — new (Crivelo config object + white Monogram mark)
    - `apps/crivelo-web/app/manifest.ts` — new
    - `apps/crivelo-web/app/icon.tsx` — new (32px browser favicon tile)
    - `apps/crivelo-web/app/apple-icon.tsx` — new (180px iOS tile, full-bleed)
    - `apps/crivelo-web/app/pwa-icon/[variant]/route.tsx` — new (192 / 512 / 512-maskable)
    - `apps/crivelo-web/app/[locale]/layout.tsx` — modified (merge PWA metadata + viewport)
  </surfaces_affected>

  <api_surface>
    <!-- Module API of @crivelo/pwa (not an HTTP API). -->

    ```ts
    // @crivelo/pwa
    import type { MetadataRoute, Metadata, Viewport } from "next";
    import type { ReactElement } from "react";

    export interface PwaConfig {
      name: string;                 // manifest name + applicationName (e.g. "Crivelo")
      shortName?: string;           // manifest short_name (defaults to name)
      description: string;          // manifest description (default-locale string)
      lang: string;                 // manifest lang (e.g. "en")
      themeColor: string;           // hex — manifest theme_color + viewport + tile background
      backgroundColor: string;      // hex — manifest background_color (splash)
      /** Brand glyph rendered white-on-themeColor. Concrete colours only —
       *  Satori can't resolve CSS vars, so pass a hex via the `color` arg. */
      mark: (opts: { size: number; color: string }) => ReactElement;
      markColor?: string;           // glyph colour on the tile (default "#ffffff")
      iconScale?: number;           // glyph size as fraction of tile (default 0.54)
      radiusScale?: number;         // corner radius as fraction of tile (default 0.29)
      iconBasePath?: string;        // manifest icon src prefix (default "/pwa-icon")
    }

    // Web app manifest with icons → `${iconBasePath}/192`, `/512`, `/512-maskable`.
    export function createManifest(cfg: PwaConfig): MetadataRoute.Manifest;

    // Core tile renderer used by icon.tsx / apple-icon.tsx / the [variant] route.
    // rounded → applies radiusScale corner; maskable → full-bleed (no radius),
    // glyph kept inside the safe zone. Returns an ImageResponse.
    export function renderIcon(
      cfg: PwaConfig,
      opts: { size: number; rounded?: boolean; maskable?: boolean }
    ): Response; // ImageResponse

    // Fragments to spread into the App Router layout.
    export function pwaMetadata(cfg: PwaConfig): Metadata;   // applicationName, appleWebApp, formatDetection
    export function pwaViewport(cfg: PwaConfig): Viewport;   // themeColor (+ sensible defaults)
    ```

    Variant mapping in the `pwa-icon/[variant]` route:
    - `192`          → `renderIcon(cfg, { size: 192, rounded: true })`
    - `512`          → `renderIcon(cfg, { size: 512, rounded: true })`
    - `512-maskable` → `renderIcon(cfg, { size: 512, maskable: true })`
    - anything else  → `404`
  </api_surface>

  <ui_copy>
    Strings live in the manifest (default locale = `en`):
    - `name` / `short_name`: `Crivelo` — the house brand (this app is the Crivelo
      hub; Coa is one tool within it). Proper noun, never translated.
    - `description`: `Tools for people who live coffee.` (matches `Meta.description` / `Shell.tagline`, en)
    - `lang`: `en`

    No new on-page UI. The icon tile is the white Crivelo Monogram (the 5×5
    sieve whose solid dots spell a "C") centred on a teal (`#1C6E68`) square;
    rounded (radius ≈ 0.29×) for `icon`/192/512, full-bleed for `apple-icon` and
    `512-maskable`. Splash `background_color` is crema `#FBF6EA`; `theme_color`
    is teal `#1C6E68`.
  </ui_copy>

  <acceptance_criteria>
    - [ ] Given the monorepo, when I run a build/typecheck from root, then `@crivelo/pwa` resolves as a workspace package and crivelo-web compiles with no type errors.
    - [ ] Given crivelo-web running, when I GET `/manifest.webmanifest`, then it returns valid JSON with `name: "Crivelo"`, `display: "standalone"`, `theme_color: "#1C6E68"`, `background_color: "#FBF6EA"`, `lang: "en"`, and three icons (192 any, 512 any, 512 maskable) pointing at `/pwa-icon/*`.
    - [ ] Given crivelo-web running, when I GET `/pwa-icon/192`, `/pwa-icon/512`, and `/pwa-icon/512-maskable`, then each returns a PNG of the correct pixel size showing the white Crivelo Monogram on a teal tile (rounded for 192/512, full-bleed for maskable).
    - [ ] Given crivelo-web running, when I GET `/pwa-icon/foo` (unknown variant), then the response is `404`.
    - [ ] Given crivelo-web running, when I GET `/icon` and `/apple-icon`, then each returns the Crivelo tile at 32×32 and 180×180 respectively.
    - [ ] Given the rendered HTML `<head>`, when I inspect it, then it includes `<link rel="manifest">`, `<meta name="theme-color" content="#1C6E68">`, and `<meta name="apple-mobile-web-app-capable" content="yes">` with the app title "Crivelo".
    - [ ] Given a phone (or DevTools "Application → Manifest" / Lighthouse PWA installability), when I add crivelo-web to the home screen, then the launcher shows the Crivelo Monogram icon and the label "Crivelo" (not a URL/screenshot).
    - [ ] Given `@crivelo/pwa`, when a second app supplies its own `PwaConfig` (different name/colour/mark), then `createManifest`/`renderIcon` produce that app's tiles with no crivelo-web-specific values leaking in (no hardcoded Crivelo strings/colours in the package).
  </acceptance_criteria>

  <risks>
    - Satori (`ImageResponse`) cannot resolve CSS variables or external fonts in
      the glyph — colours must be concrete hex. The `mark` callback takes an
      explicit `color`; crivelo-web passes the white Monogram sieve glyph (not `var(--brand)`).
      Mitigation: the Crivelo Monogram in `pwa.config.tsx` is an inline SVG with literal
      colours, mirroring Molly's inline-SVG approach.
    - App Router file conventions (`manifest.ts`, `icon.tsx`, `route.tsx`) must
      live in the app's `app/` tree — they can't be exported from a package. The
      package provides the *logic*; the app keeps thin wrapper files. This split
      is intentional, not a limitation to engineer around.
    - The `pwa-icon/[variant]` route should set `runtime = "nodejs"` (as Molly
      does) to keep `ImageResponse` rendering reliable under Next 14.
    - Manifest is single-locale by design; if Crivelo later needs a localised
      description this becomes a follow-up (out of scope here).
  </risks>

  <breakdown_sketch>
    - Scaffold `@crivelo/pwa` package: `package.json`, `index.ts` + `PwaConfig` type.
    - Implement `createManifest` + `pwaMetadata`/`pwaViewport`.
    - Implement `renderIcon` tile renderer (rounded / maskable / glyph safe-zone).
    - crivelo-web: add dep, write `app/pwa.config.tsx` with the white Crivelo Monogram mark.
    - crivelo-web: add `manifest.ts`, `icon.tsx`, `apple-icon.tsx`, `pwa-icon/[variant]/route.tsx`.
    - crivelo-web: merge `pwaMetadata`/`pwaViewport` into `[locale]/layout.tsx`.
    - Verify: manifest JSON, icon endpoints, head tags, Lighthouse/DevTools installability.
  </breakdown_sketch>

</feature_specification>
