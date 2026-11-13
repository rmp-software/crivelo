/**
 * Salis service-worker entry.
 *
 * Runs in the ServiceWorker global scope — type-checked under WebWorker libs via
 * tsconfig.worker.json (and excluded from the app's DOM tsconfig). All the logic
 * lives in the shared `@crivelo/pwa/sw` `createServiceWorker`; this file supplies
 * only the two things that MUST be app-local: the `self.__SW_MANIFEST` injection
 * token (the build-time precache-manifest replacement point — it has to appear
 * here physically) and the bundler-specific `defaultCache`.
 *
 * `locales: []` is NOT a placeholder — it is @crivelo/pwa's convention for "this
 * app's routes are unprefixed". Salis is single-locale pt-BR and serves
 * /receitas, not /pt/receitas, so the package registers one document fallback at
 * /offline with no locale matching, and precaches "/" as the shell. Passing
 * `["pt"]` would build everything under a /pt prefix that does not exist. Keep it
 * identical to the value in app/serwist/[path]/route.ts.
 */
import { defaultCache } from "@serwist/turbopack/worker";
import { createServiceWorker } from "@crivelo/pwa/sw";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Serwist replaces this token with the build's content-hashed precache list.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

createServiceWorker({
  manifest: self.__SW_MANIFEST,
  locales: [],
  offlinePath: "/offline",
  defaultCache,
});
