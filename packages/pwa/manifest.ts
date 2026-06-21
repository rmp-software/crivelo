import type { MetadataRoute } from "next";
import type { PwaConfig } from "./index";

/**
 * Build a web app manifest from a PwaConfig. Icons point at the app's
 * `pwa-icon/[variant]` route (192 + 512 "any", 512 "maskable"), which renders
 * the same tiles `renderIcon` produces. `display: "standalone"` is what makes
 * the launcher entry app-like rather than a browser shortcut.
 *
 * `locale` is opt-in. Omitted (or `cfg.i18n` absent, or the locale not declared
 * in `cfg.i18n.locales`) → the non-localized manifest, byte-identical to the
 * single-locale behaviour (`start_url: "/"`, no `id`, no `dir`, top-level
 * `description`/`lang`). A known locale → a per-locale manifest with a 200
 * `start_url`, a distinct `id` (so each locale is a separate installable app),
 * and that locale's `lang`/`dir`/`description`.
 */
export function createManifest(
  cfg: PwaConfig,
  locale?: string,
): MetadataRoute.Manifest {
  const base = cfg.iconBasePath ?? "/pwa-icon";
  const icons: MetadataRoute.Manifest["icons"] = [
    { src: `${base}/192`, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: `${base}/512`, sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: `${base}/512-maskable`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ];

  const localeData =
    locale !== undefined ? cfg.i18n?.locales[locale] : undefined;

  // No locale, no i18n, or an unknown locale → the original non-localized
  // manifest. This path must stay byte-identical to the pre-i18n output.
  if (localeData === undefined) {
    return {
      name: cfg.name,
      short_name: cfg.shortName ?? cfg.name,
      description: cfg.description,
      lang: cfg.lang,
      start_url: "/",
      display: "standalone",
      background_color: cfg.backgroundColor,
      theme_color: cfg.themeColor,
      icons,
    };
  }

  // `||` (not `??`) so an empty `startUrl: ""` — valid per the `string |
  // undefined` type — also falls back to `/${locale}`, never a broken "".
  const startUrl = localeData.startUrl || `/${locale}`;
  return {
    name: cfg.name,
    short_name: cfg.shortName ?? cfg.name,
    description: localeData.description,
    lang: localeData.lang,
    dir: localeData.dir ?? "ltr",
    start_url: startUrl,
    id: startUrl,
    display: "standalone",
    background_color: cfg.backgroundColor,
    theme_color: cfg.themeColor,
    icons,
  };
}
