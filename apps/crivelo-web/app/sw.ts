/**
 * crivelo-web service-worker entry (offline / Phase 1B).
 *
 * Runs in the ServiceWorker global scope — checked under WebWorker libs via
 * tsconfig.worker.json (excluded from the app's DOM tsconfig). All logic lives in
 * the shared `@crivelo/pwa/sw` `createServiceWorker`; this file only supplies the
 * two things that MUST be app-local: the `self.__SW_MANIFEST` injection token
 * (the build-time precache-manifest replacement point — it must physically appear
 * here) and the bundler-specific `defaultCache` from `@serwist/turbopack/worker`.
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
  locales: ["en", "pt"],
  // Locale-relative — the package prefixes it per locale → /{locale}/offline.
  offlinePath: "/offline",
  defaultCache,
});
