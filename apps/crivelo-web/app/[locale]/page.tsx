// Coa homepage (RMP-191). The Crivelo shell (header / nav / footer) is provided
// by the [locale] layout; this page renders the calculator body inside it. The
// CoaCalculator owns the idle ↔ brew view state and the responsive layout. All
// copy resolves from the message catalog (RMP-193) via next-intl hooks.
//
// The "Edit" action (feature: coa-save-recipes) lands here with the recipe params
// in the query (`/[locale]?dose=…&ratio=…&acidity=…&strength=…`). We parse + clamp
// them on the server via the shared `parseRecipeParams` and seed the calculator with
// the result, so the inputs are pre-filled on the very first paint — no client
// `useSearchParams` (and the Suspense boundary it forces) and no hydration mismatch.
// A bare `/[locale]` (no query) parses to the calculator defaults, i.e. today's behavior.
import { setRequestLocale } from "next-intl/server";
import { CoaCalculator } from "../../components/coa";
import { parseRecipeParams, recipeParamsToQuery } from "../../lib/recipes-store";

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  // Bind next-intl to the resolved locale for this request (server message/format
  // resolution). NOTE: awaiting `searchParams` below opts this page into DYNAMIC
  // (per-request) rendering in Next 15 — it is NOT statically rendered. That is
  // intentional: the recipe params must be parsed + seeded on the FIRST server paint
  // (the "Edit" landing), so the calculator's inputs are correct before hydration. A
  // client `useSearchParams` fallback would re-introduce a Suspense boundary and an
  // input flash, which is exactly what reading searchParams here avoids.
  setRequestLocale(locale);

  // Collapse the (possibly multi-valued) query into a flat string map, then parse +
  // clamp to valid RecipeParams. Missing/out-of-range keys fall back to the calculator
  // defaults, so a bare URL yields the normal defaults.
  const sp = await searchParams;
  const query = new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key, Array.isArray(value) ? (value[0] ?? "") : value] as [string, string]],
    ),
  );
  const initialParams = parseRecipeParams(query);

  // `useRecipe` (and the TastePad puck) seed their state from `initialParams` in
  // `useState` initializers, which run ONLY on first mount. An "Edit" navigation is a
  // query-only client transition that does NOT remount `CoaCalculator` by itself, so
  // those initializers wouldn't re-run and the inputs would keep the stale state.
  // Keying the calculator on the canonical params query forces a fresh mount exactly
  // when the seeded params change — mirroring the `key={query}` reset in BrewView. The
  // key is the canonical serialization (not the raw URL) so ordering/extra keys don't
  // perturb it, and a bare `/[locale]` keeps the stable defaults key (no churn).
  const paramsKey = recipeParamsToQuery(initialParams);

  return <CoaCalculator key={paramsKey} initialParams={initialParams} />;
}
