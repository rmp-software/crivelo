/**
 * Coa — locale-relative navigation hrefs for the recipe flow (feature:
 * coa-save-recipes).
 *
 * The brew route is a pure function of its query string, and several call sites
 * navigate into it with the same shape: the calculator's "Begin brew", a "Brew
 * again" action (later task), and the home/last-brew + recipes-list cards (later
 * tasks). To keep parse + build in lockstep these hrefs funnel exclusively through
 * the `recipes-store` URL helpers (`recipeParamsToQuery`, `AUTOSTART_PARAM`) — no
 * hand-built query strings anywhere.
 *
 * Paths are locale-RELATIVE (no `/[locale]` prefix): they are meant for the
 * locale-aware `useRouter`/`Link` from `i18n/navigation`, which injects the active
 * locale prefix itself. Pure; no React.
 */
import {
  AUTOSTART_PARAM,
  recipeParamsToQuery,
  type RecipeParams,
} from "./recipes-store";

/**
 * Href for the running-brew route. `autostart` is `1` (start the pre-roll on
 * load — the calculator's "Begin brew") or `0` (land in the "ready" state — a
 * "Brew again" re-launch). The recipe params are clamped + serialized via the
 * shared `recipeParamsToQuery`, then the autostart flag is appended.
 */
export function brewHref(params: RecipeParams, autostart: boolean): string {
  const query = recipeParamsToQuery(params);
  return `/brew?${query}&${AUTOSTART_PARAM}=${autostart ? "1" : "0"}`;
}

/**
 * Href back to the idle calculator with the recipe params pre-filled (the "Edit"
 * action). The calculator seeds its inputs from this query on mount (later task).
 */
export function editHref(params: RecipeParams): string {
  return `/?${recipeParamsToQuery(params)}`;
}
