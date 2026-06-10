import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing (RMP-193). Redirects the bare `/` to the default locale
 * (`/en`) so the root resolves instead of 404-ing, and matches both locale
 * prefixes (`/en`, `/pt`). Static assets and API routes are excluded.
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for static files, _next internals and anything
  // containing a dot (e.g. favicon.ico, image assets).
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
