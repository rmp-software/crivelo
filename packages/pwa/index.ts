/**
 * @crivelo/pwa — shared "add to home screen" plumbing for Crivelo apps.
 *
 * Encapsulates the Molly-proven PWA setup (web app manifest + on-the-fly icon
 * tiles via next/og + iOS web-app meta) so any app becomes installable by
 * supplying ONE config object: name, colours, and a brand glyph. Installable
 * only — no service worker, no offline caching, no install-prompt UI.
 *
 * App Router file conventions (manifest.ts, icon.tsx, route.tsx) must live in
 * the consuming app's `app/` tree, so this package ships the *logic* and the
 * app keeps thin wrapper files that call into it. See apps/crivelo-web/app/*.
 *
 * Consuming apps must add "@crivelo/pwa" to next.config `transpilePackages`
 * (this package ships raw .ts/.tsx, like @crivelo/tokens).
 */
import type { ReactElement } from "react";

export interface PwaConfig {
  /** Manifest `name` + `applicationName` + iOS web-app title (e.g. "Coa"). */
  name: string;
  /** Manifest `short_name`. Defaults to `name`. */
  shortName?: string;
  /** Manifest `description`, in the app's default-locale string. */
  description: string;
  /** Manifest `lang` (e.g. "en"). */
  lang: string;
  /** Hex — manifest `theme_color` + viewport theme-color + icon-tile background. */
  themeColor: string;
  /** Hex — manifest `background_color` (the splash screen behind the icon). */
  backgroundColor: string;
  /**
   * Brand glyph for the icon tile, rendered `markColor` on `themeColor`.
   * Satori (next/og) cannot resolve CSS variables or external fonts, so the
   * callback receives a concrete hex `color` and must use literal colours only.
   */
  mark: (opts: { size: number; color: string }) => ReactElement;
  /** Glyph colour on the tile. Default "#ffffff". */
  markColor?: string;
  /** Glyph size as a fraction of the tile. Default 0.54. */
  iconScale?: number;
  /** Corner radius as a fraction of the tile (rounded tiles only). Default 0.29. */
  radiusScale?: number;
  /** Manifest icon `src` prefix. Default "/pwa-icon". */
  iconBasePath?: string;
}

export { createManifest } from "./manifest";
export { renderIcon } from "./icon";
export { pwaMetadata, pwaViewport } from "./metadata";
