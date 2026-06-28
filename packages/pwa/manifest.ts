import type { MetadataRoute } from "next";
import type { PwaConfig } from "./index";

/**
 * Build a web app manifest from a PwaConfig. Icons point at the app's
 * `pwa-icon/[variant]` route (192 + 512 "any", 512 "maskable"), which renders
 * the same tiles `renderIcon` produces. `display: "standalone"` is what makes
 * the launcher entry app-like rather than a browser shortcut.
 */
export function createManifest(cfg: PwaConfig): MetadataRoute.Manifest {
  const base = cfg.iconBasePath ?? "/pwa-icon";
  return {
    name: cfg.name,
    short_name: cfg.shortName ?? cfg.name,
    description: cfg.description,
    lang: cfg.lang,
    // Default "/"; i18n+offline apps override with a precached default-locale shell
    // (see PwaConfig.startUrl) so an offline launch lands on the app, not the fallback.
    start_url: cfg.startUrl ?? "/",
    display: "standalone",
    background_color: cfg.backgroundColor,
    theme_color: cfg.themeColor,
    icons: [
      { src: `${base}/192`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/512`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `${base}/512-maskable`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
