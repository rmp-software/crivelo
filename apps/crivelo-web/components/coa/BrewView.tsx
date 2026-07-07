"use client";

/**
 * BrewView (feature: coa-save-recipes) — the client body of the `/[locale]/brew`
 * route. The brew flow is now a pure function of the URL: this component reads the
 * recipe params + autostart flag from the query string, derives the recipe via the
 * 4:6 engine, and hands both to `BrewTimer`.
 *
 *  - **URL is the source of truth.** Params come from `useSearchParams` parsed by
 *    the shared `parseRecipeParams` (missing / out-of-range values clamp or fall
 *    back to the calculator defaults — no re-validation here). The canonical query
 *    (`recipeParamsToQuery`) is passed to the timer as its session-stamp so a new
 *    brew resets a stale session instead of resuming a previous brew's timer.
 *  - **autostart** drives whether the pre-roll starts on load (`1`, from "Begin
 *    brew") or the timer lands in the "ready" pre-state (`0`, from "Brew again").
 *  - **onExit** routes back to the idle calculator (`/[locale]`), preserving the
 *    locale prefix via the locale-aware router.
 *
 * Client component: `BrewTimer` owns `localStorage`/`window` state, and the params
 * live in the URL query (not the path), so reading them client-side is correct.
 */
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useRouter } from "../../i18n/navigation";
import { computeRecipe } from "../../lib/four-six";
import {
  AUTOSTART_PARAM,
  parseRecipeParams,
  recipeParamsToQuery,
} from "../../lib/recipes-store";

/**
 * The timer resolves its opening session from `localStorage` + the wall clock
 * (`Date.now()`) in its state initializer, so its first paint is inherently
 * client-only — server-rendering it produces a different ring offset than the
 * client and trips a hydration mismatch. Loaded with `ssr: false` so it mounts
 * purely on the client (no SSR markup to reconcile), mirroring how the brew flow
 * behaved before the route extraction (it only ever mounted behind "Begin brew").
 */
/**
 * Minimal pre-paint skeleton for the brew screen. Two async paint-gates stack
 * before the timer shows: the `<Suspense>` boundary in `page.tsx` (it suspends
 * while the client reads `useSearchParams` on hydration) and this `dynamic`
 * import (the timer chunk loads client-only). Both default to rendering nothing —
 * a blank flash + layout shift on cold load. This skeleton fills that gap: a
 * centered placeholder ring that reserves the timer's vertical rhythm (ring +
 * action area + CTA) so the real screen swaps in without a jump. Shared as the
 * Suspense `fallback` AND the `dynamic` `loading` so either gate shows the same
 * frame. Token/utility-styled per CLAUDE.md.
 */
export function BrewSkeleton() {
  return (
    <main className="mx-auto box-border max-w-[390px] px-5 pt-2.5 pb-12 md:max-w-[700px] md:px-6 md:pt-4 md:pb-[60px] lg:max-w-[1000px]">
      <div className="mb-2 flex items-center justify-between md:mb-4">
        <div className="h-5 w-20 rounded-sm bg-surface-raised" />
        <div className="h-4 w-16 rounded-sm bg-surface-raised" />
      </div>
      {/* Mirror BrewTimer's two-column shape: at md+ the ring/action/CTA sit in
          the left column and the recipe list occupies the right, so a desktop
          cold load reserves the real layout's footprint (no vertical jump when
          the timer swaps in). */}
      <div className="block items-start md:grid md:grid-cols-[300px_1fr] md:gap-[52px] lg:grid-cols-[340px_1fr]">
        <div>
          <div className="flex justify-center">
            {/* Box mirrors the timer's cropped 270°-arc dial (incl. the
                short-viewport clamp) so the swap-in doesn't jump; the circle
                inside is just the pulse glyph. */}
            <div className="flex h-[196px] w-[236px] items-start justify-center max-md:[@media(max-height:700px)]:h-[158px] max-md:[@media(max-height:700px)]:w-[190px] md:h-[226px] md:w-[272px]">
              <div className="aspect-square h-full animate-pulse rounded-full border-8 border-border-strong motion-reduce:animate-none" />
            </div>
          </div>
          <div className="mt-4 flex min-h-[50px] flex-col items-center gap-2">
            <div className="h-6 w-40 rounded-sm bg-surface-raised" />
            <div className="h-4 w-28 rounded-sm bg-surface-raised" />
          </div>
          <div className="mt-[22px] h-[54px] w-full rounded-md bg-surface-raised" />
        </div>
        {/* Right column: minimal recipe-list stub (heading bar + a few rows) so
            the two-column footprint is reserved at md+. Structural parity, not
            pixel-perfect content. */}
        <div className="mt-7 md:mt-1">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="h-4 w-16 rounded-sm bg-surface-raised" />
            <div className="h-4 w-12 rounded-sm bg-surface-raised" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none" />
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none" />
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none" />
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none" />
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-raised motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </main>
  );
}

const BrewTimer = dynamic(
  () => import("./BrewTimer").then((m) => m.BrewTimer),
  { ssr: false, loading: () => <BrewSkeleton /> },
);

export function BrewView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse + clamp the recipe params from the URL, then derive the recipe. The
  // canonical query is the timer's session stamp (so it stays in lockstep with
  // what the calculator/cards build, and a param change resets a stale session).
  // `parseRecipeParams` reads a `URLSearchParams` directly — no `.toString()`
  // round-trip — while the stamp is rebuilt canonically via `recipeParamsToQuery`.
  const params = parseRecipeParams(searchParams);
  const query = recipeParamsToQuery(params);
  const recipe = computeRecipe(params);

  // autostart=1 (default for a bare/garbage value would be "not 1" → ready); the
  // pre-roll only auto-starts on an explicit "1", matching "Begin brew".
  const autostart = searchParams.get(AUTOSTART_PARAM) === "1";

  // Key the timer on the canonical params query. A query-only navigation (e.g.
  // "Brew again" with different params) doesn't remount the route component by
  // itself, so the timer's session-resolution initializer wouldn't re-run; keying
  // on `query` forces a fresh mount when the params change, which is exactly when
  // a stale session must be reset (and NOT when only `autostart` differs, since
  // the key excludes it). A same-params reload keeps the same key → resumes.
  return (
    <BrewTimer
      key={query}
      recipe={recipe}
      params={params}
      query={query}
      autostart={autostart}
      onExit={() => router.push("/")}
    />
  );
}
