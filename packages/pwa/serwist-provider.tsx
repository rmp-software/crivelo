/**
 * @crivelo/pwa/serwist-provider — the client-side SW registrar.
 *
 * Re-exports `@serwist/turbopack/react`'s `SerwistProvider` so apps import it
 * from `@crivelo/pwa` like every other PWA primitive (and never depend on the
 * Serwist package path directly). Mount it once in the root layout:
 *
 * ```tsx
 * <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
 * ```
 */
"use client";

export { SerwistProvider } from "@serwist/turbopack/react";
export type { SerwistProviderProps } from "@serwist/turbopack/react";
