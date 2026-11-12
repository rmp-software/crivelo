import type { NextConfig } from "next";

// TypeScript config from day one, deliberately: the @crivelo/pwa offline half
// (Serwist) is ESM-only and throws from a CJS next.config.js, so an app that
// will go offline-first must not start on CJS. See packages/pwa/CLAUDE.md.
const nextConfig: NextConfig = {
  // Both packages ship raw .ts/.tsx/.css and must be transpiled by the app.
  transpilePackages: ["@crivelo/ui", "@salis/tokens"],
};

export default nextConfig;
