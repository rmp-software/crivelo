const createNextIntlPlugin = require("next-intl/plugin");

// Wire next-intl (RMP-193) to the per-request config at ./i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@crivelo/ui", "@crivelo/tokens", "@crivelo/pwa"],
  // Force blocking (non-streamed) metadata for ALL user agents. Since Next 15.2,
  // async generateMetadata is streamed into <body> and relies on client-side
  // hoisting into <head> — which Safari/iOS does NOT do for apple-touch-startup-image
  // / apple-mobile-web-app-* tags, so the PWA splash never shows and the home-screen
  // name falls back to <title>. Matching every UA opts back into blocking metadata so
  // the tags render in <head>. TTFB cost is negligible here (generateMetadata only
  // awaits getTranslations, already loaded for the page). See vercel/next.js#79313.
  htmlLimitedBots: /.*/,
}

module.exports = withNextIntl(nextConfig)
