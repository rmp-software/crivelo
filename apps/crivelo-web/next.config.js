const createNextIntlPlugin = require("next-intl/plugin");

// Wire next-intl (RMP-193) to the per-request config at ./i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@crivelo/ui", "@crivelo/tokens", "@crivelo/pwa"],
}

module.exports = withNextIntl(nextConfig)
