/**
 * Serves the compiled service worker at /serwist/sw.js (offline / Phase 1B).
 *
 * The whole route is the shared factory: `createCriveloSerwistRoute` compiles
 * `app/sw.ts`, injects the precache manifest, and adds the localized shell +
 * offline-page precache entries built from `locales` + `offlinePath`. No
 * `runtime` export is needed — the factory returns `dynamic: "force-static"`.
 * The `[path]` segment name is required by the factory (it reads `params.path`).
 *
 * This file is Node/build context, so it derives `locales` from the single i18n
 * source of truth (`routing.locales`). The worker entry `app/sw.ts` must instead
 * hardcode them (worker scope can't import the next-intl routing module).
 */
import { createCriveloSerwistRoute } from "@crivelo/pwa/serwist";
import { routing } from "../../../i18n/routing";

export const { GET, generateStaticParams, dynamic, dynamicParams, revalidate } =
  createCriveloSerwistRoute({
    swSrc: "app/sw.ts",
    locales: [...routing.locales],
    offlinePath: "/offline",
  });
