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
    locale !== undefined &&
    cfg.i18n !== undefined &&
    Object.hasOwn(cfg.i18n.locales, locale)
      ? cfg.i18n.locales[locale]
      : undefined;

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

/** The MIME type the spec mandates a web app manifest be served with. */
const MANIFEST_CONTENT_TYPE = "application/manifest+json";

/**
 * Build the App-Router `GET` handler for an app's `manifest/[locale]` route from
 * its PwaConfig. The locale-aware sibling of `createSplashRoute`: the package
 * owns ALL the route logic (locale lookup + the i18n-aware status decision +
 * serialization) so the app's route file is just `export const { GET } =
 * createManifestRoute(cfg)`. The dynamic segment MUST be named `locale` — the
 * factory reads `params.locale` as a plain string (NO i18n-library import; the
 * app, the only place that knows the locale set, supplies it via `cfg.i18n`).
 *
 * Status policy:
 *  - `cfg.i18n` configured but the locale is NOT in `cfg.i18n.locales` → 404.
 *  - `cfg.i18n` absent (the route is wired but no locales declared) → serve the
 *    non-localized `createManifest(cfg)`. A misconfig degrades to "works, not
 *    localized", never a 404.
 *  - otherwise → the localized `createManifest(cfg, locale)`.
 *
 * Like `createSplashRoute`, this returns ONLY the handler. A `runtime` export, if
 * the app needs one, is the app wrapper's job (Next reads it as a static literal
 * from the route module — it can't be returned from a factory).
 */
export function createManifestRoute(cfg: PwaConfig): {
  GET: (
    req: Request,
    ctx: { params: Promise<{ locale: string }> }
  ) => Promise<Response>;
} {
  async function GET(
    _req: Request,
    ctx: { params: Promise<{ locale: string }> }
  ): Promise<Response> {
    const { locale } = await ctx.params;

    // i18n configured: a locale not declared in `cfg.i18n.locales` → 404. Use
    // `Object.hasOwn` (not a bracket `=== undefined` check) so inherited
    // prototype keys ("toString", "constructor", …) don't bypass the guard.
    if (cfg.i18n !== undefined) {
      if (!Object.hasOwn(cfg.i18n.locales, locale)) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(JSON.stringify(createManifest(cfg, locale)), {
        headers: { "Content-Type": MANIFEST_CONTENT_TYPE },
      });
    }

    // i18n absent → serve the non-localized manifest (no locale arg).
    return new Response(JSON.stringify(createManifest(cfg)), {
      headers: { "Content-Type": MANIFEST_CONTENT_TYPE },
    });
  }

  return { GET };
}
