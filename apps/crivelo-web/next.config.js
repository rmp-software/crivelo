const createNextIntlPlugin = require("next-intl/plugin");

// Wire next-intl (RMP-193) to the per-request config at ./i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@crivelo/ui", "@crivelo/tokens", "@crivelo/pwa"],
  // The bare /manifest.webmanifest no longer has its own route (app/manifest.ts
  // was removed because Next forces metadata.manifest to /manifest.webmanifest
  // whenever that file exists, overriding our per-locale link). Redirect it to
  // the default-locale manifest so any cached/hardcoded reference still resolves.
  // The next-intl middleware matcher excludes dotted paths, so this isn't
  // intercepted by i18n routing.
  async redirects() {
    return [
      {
        source: "/manifest.webmanifest",
        destination: "/manifest/en",
        // 307 (not 308): this is a back-compat shim for clients that cached the
        // bare URL, not a canonical relocation — keep it uncached so the target
        // can follow the default locale if it ever changes.
        permanent: false,
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
