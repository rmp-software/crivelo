import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withCriveloSerwist } from "@crivelo/pwa/serwist";

// Migrated from CJS next.config.js → next.config.ts (offline / Phase 1B):
// @serwist/turbopack is ESM-only and @crivelo/pwa ships raw TS, so a CJS config
// throws the moment it imports withCriveloSerwist. Next 16 supports a TS config
// natively. Everything the JS config carried is preserved verbatim below.

// Wire next-intl (RMP-193) to the per-request config at ./i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@crivelo/ui", "@crivelo/tokens", "@crivelo/pwa"],
  // Force blocking (non-streamed) metadata for ALL user agents. Since Next 15.2,
  // async generateMetadata is streamed into <body> and relies on client-side
  // hoisting into <head> — which Safari/iOS does NOT do for apple-touch-startup-image
  // / apple-mobile-web-app-* tags, so the PWA splash never shows and the home-screen
  // name falls back to <title>. Matching every UA opts back into blocking metadata so
  // the tags render in <head>. TTFB cost is negligible here (generateMetadata only
  // awaits getTranslations, already loaded for the page). See vercel/next.js#79313.
  htmlLimitedBots: /.*/,
  // The service worker must never be cached long: a stale SW would pin users to an
  // old precache. `max-age=0, must-revalidate` makes the browser revalidate it on
  // every load so a new deploy's SW is picked up immediately. The SW is served by
  // app/serwist/[path]/route.ts at /serwist/sw.js.
  async headers() {
    return [
      {
        source: "/serwist/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

// Compose the Serwist Turbopack integration UNDER next-intl, per the @crivelo/pwa
// offline checklist: withNextIntl(withCriveloSerwist(cfg)).
export default withNextIntl(withCriveloSerwist(nextConfig));
