import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing (RMP-193). Redirects the bare `/` to the default locale
 * (`/en`) so the root resolves instead of 404-ing, and matches both locale
 * prefixes (`/en`, `/pt`). Static assets and API routes are excluded.
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for static files, _next internals, anything
  // containing a dot (e.g. favicon.ico, manifest.webmanifest), and the
  // extension-less PWA metadata routes (icon/apple-icon/pwa-icon) — those are
  // served at the root, NOT under a locale prefix, so they must skip i18n.
  matcher: "/((?!_next|_vercel|icon|apple-icon|pwa-icon|.*\\..*).*)",
};
