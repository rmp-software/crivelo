import type { NextConfig } from "next";
import { withCriveloSerwist } from "@crivelo/pwa/serwist";

// TypeScript config from day one, deliberately: the @crivelo/pwa offline half
// (Serwist) is ESM-only and throws from a CJS next.config.js, so an app that
// will go offline-first must not start on CJS. See packages/pwa/CLAUDE.md.
const nextConfig: NextConfig = {
  // These packages ship raw .ts/.tsx/.css and must be transpiled by the app.
  transpilePackages: ["@crivelo/ui", "@salis/tokens", "@crivelo/pwa"],
  // The service worker must never be cached long: a stale SW would pin students
  // to an old precache. `max-age=0, must-revalidate` makes the browser
  // revalidate it on every load, so a new deploy's SW is picked up immediately.
  // It is served by app/serwist/[path]/route.ts at /serwist/sw.js.
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
  // NO `htmlLimitedBots` here, unlike crivelo-web — deliberately. That escape
  // hatch exists for a layout with an ASYNC `generateMetadata` (crivelo-web
  // awaits next-intl translations), which Next 15.2+ streams into <body>, where
  // iOS never sees the apple-touch-startup-image tags. Salis's root layout
  // exports a STATIC `metadata` object, so metadata is not streamed and the tags
  // land in <head> — checked against the production build's HTML, not assumed.
  // If a future screen makes the layout's metadata async, add it back.
};

// Compose the Serwist Turbopack integration, per the @crivelo/pwa offline
// checklist. Salis has no i18n plugin to nest it under.
export default withCriveloSerwist(nextConfig);
