/**
 * Serves the compiled service worker at /serwist/sw.js.
 *
 * `createCriveloSerwistRoute` compiles `app/sw.ts`, injects the build's precache
 * manifest, and adds the shell + offline-page precache entries built from
 * `locales` + `offlinePath`. No `runtime` export is needed — the factory returns
 * `dynamic: "force-static"`. The `[path]` segment name is required by the factory
 * (it reads `params.path`).
 *
 * `locales: []` must match app/sw.ts: it is @crivelo/pwa's convention for an
 * unprefixed single-locale app, and here it precaches "/" and "/offline" rather
 * than per-locale shells. See packages/pwa/CLAUDE.md.
 */
import { createCriveloSerwistRoute } from "@crivelo/pwa/serwist";
import { content } from "../../content";

/**
 * Every HTML route a student can reach, precached so the whole app opens with no
 * network — the `docs/01-v1-plan.md` "offline-first" requirement, which asks for
 * more than the package precaches on its own.
 *
 * WHY THE APP HAS TO LIST THESE. Serwist's build manifest covers build ASSETS
 * (the JS/CSS chunks that carry the dosing engine and `content.json`), not
 * rendered HTML routes, and @crivelo/pwa adds only the shell + the offline page.
 * Without this list the app boots offline at "/" and then dies on the first
 * push: Next's client router asks for the route's RSC payload, and
 * @serwist/turbopack's `pages-rsc` rule caches those under their exact URL
 * INCLUDING the `?_rsc=<hash>` cache-buster — a hash that differs between the
 * prefetch and the navigation, so a prefetched payload never matches. The router
 * then falls back to a full browser navigation, which is a plain document
 * request, which the precache CAN serve. Precaching the documents is therefore
 * what closes the gap — and it is also why `generateStaticParams` is not needed
 * on the dynamic segments: the worker fetches each URL once at install time,
 * server render and all.
 *
 * Derived from `content`, never hand-listed, so a recipe Juliana adds to the
 * sheet is precached by virtue of being in it.
 */
const appRoutes = [
  "/onboarding",
  "/receitas",
  "/concentrados",
  "/aprender",
  ...content.recipes.flatMap((recipe) => [
    `/receitas/${recipe.id}`,
    // S3 modo preparo. The screen most likely to be opened with no network —
    // it is the one you hold over the counter — so it needs its own entry, not
    // merely a recipe that links to it.
    `/receitas/${recipe.id}/preparo`,
  ]),
  ...content.concentrates.map(
    (concentrate) => `/concentrados/${concentrate.id}`,
  ),
];

/**
 * One revision for every precached HTML document in this build, the app's and
 * the package's alike — passing `revision` opts out of the package's
 * `NEXT_DEPLOYMENT_ID` default so the two halves cannot stamp different values.
 *
 * Evaluated once, when the build renders this force-static route. The cost of a
 * timestamp over a deployment id is that an identical re-deploy re-fetches these
 * ~12 small documents; the content-hashed `/_next/static` entries are unaffected
 * (they carry `revision: null` and dedupe on their own).
 */
const revision = Date.now().toString(36);

export const { GET, generateStaticParams, dynamic, dynamicParams, revalidate } =
  createCriveloSerwistRoute({
    swSrc: "app/sw.ts",
    locales: [],
    offlinePath: "/offline",
    revision,
    additionalPrecacheEntries: appRoutes.map((url) => ({ url, revision })),
  });
