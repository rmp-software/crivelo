/**
 * Coa — recipe persistence + URL param helpers (feature: coa-save-recipes).
 *
 * `crivelo-web` is a pure client-side PWA: no database, no auth, no API. Every
 * read/write here goes through `localStorage`, mirroring the existing `coa-brew`
 * session in `components/coa/BrewTimer.tsx`. This module is the single seam every
 * later task in the feature imports, so the rules live in ONE place:
 *
 *  - **SSR-safe.** Every accessor guards `typeof window === 'undefined'` and
 *    returns a neutral value (null / []) on the server, so a component can call
 *    it during render without crashing.
 *  - **Never throws on bad data.** Corrupt JSON, a wrong shape, or a quota error
 *    falls back to null / [] rather than propagating — a poisoned key can never
 *    crash the app.
 *  - **Params are the source of truth.** Only the four inputs are stored; the
 *    full schedule (water, pours, times) is always re-derived via
 *    `computeRecipe()`, never persisted (avoids sync drift).
 *
 * Pure/typed; no React. The URL helpers (`parseRecipeParams` /
 * `recipeParamsToQuery`) are the one source of truth for the recipe query string
 * shape so the calculator, the home cards, the `/brew` route, and the recipes
 * list all serialize/parse params identically.
 */
import { clamp, finiteOr } from "./four-six";

/** localStorage key for the implicit, auto-captured last brew (single slot). */
const LAST_BREW_KEY = "coa-last-brew";
/** localStorage key for the array of explicitly saved, named recipes. */
const RECIPES_KEY = "coa-recipes";

/**
 * Same-window change signal for the saved-recipes list. `localStorage`'s native
 * `storage` event fires for OTHER tabs only — never for the tab that performed
 * the write — so a same-window save/delete (the common case: save on a brew's
 * done screen, delete on `/recipes`) would leave a long-lived consumer (the
 * header badge) stale until a reload. Every `coa-recipes` write below dispatches
 * this event so same-window subscribers can re-read. {@link subscribeRecipes}
 * wires this together with the cross-tab `storage` event.
 */
const RECIPES_CHANGED_EVENT = "coa:recipes-changed";

/** Notify same-window subscribers that `coa-recipes` changed. SSR no-op. */
function notifyRecipesChanged(): void {
  if (!hasStorage()) return;
  window.dispatchEvent(new Event(RECIPES_CHANGED_EVENT));
}

/**
 * Subscribe to saved-recipe list changes from BOTH sources and return an
 * unsubscribe. Same-window writes fire {@link RECIPES_CHANGED_EVENT} (dispatched
 * by `addRecipe`/`deleteRecipe`); other-tab writes fire the native `storage`
 * event. A consumer (e.g. the header badge) calls this once and re-reads
 * `getRecipes()` in `cb`, instead of re-wiring both listeners itself. SSR-safe:
 * returns a no-op unsubscribe off-DOM.
 */
export function subscribeRecipes(cb: () => void): () => void {
  if (!hasStorage()) return () => {};
  const onStorage = (e: StorageEvent) => {
    // Ignore unrelated keys; `e.key === null` is a `clear()` (treat as changed).
    if (e.key === null || e.key === RECIPES_KEY) cb();
  };
  window.addEventListener(RECIPES_CHANGED_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(RECIPES_CHANGED_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Query-string key for the brew-route autostart flag (`1` = start the pre-roll
 * on load, `0` = land in the "ready" state). Exposed for the brew route + the
 * navigation call sites to share one literal; the route task consumes it.
 */
export const AUTOSTART_PARAM = "autostart";

/**
 * The four concrete recipe inputs. Unlike {@link RecipeInput} (where `acidity`
 * and `strengthPours` are optional engine inputs), a stored/active recipe always
 * carries all four resolved values — there is no "unset" once persisted.
 */
export interface RecipeParams {
  /** Dose of coffee in grams. Range {@link DOSE_RANGE}. */
  dose: number;
  /** Brew ratio (water per gram of coffee). Range {@link RATIO_RANGE}. */
  ratio: number;
  /** Taste axis: -1 (sweet) .. 0 (balanced) .. +1 (bright). Range {@link ACIDITY_RANGE}. */
  acidity: number;
  /** Count of latter-60% pours. Range {@link STRENGTH_RANGE}. */
  strengthPours: number;
}

/** The implicit last brew — params only, plus when it was brewed. */
export interface LastBrew {
  params: RecipeParams;
  /** `Date.now()` at the moment the brew completed. */
  brewedAt: number;
}

/** An explicitly saved, named recipe with optional metadata. */
export interface SavedRecipe {
  /** Stable id (`crypto.randomUUID()`). */
  id: string;
  /** Required display name. */
  name: string;
  /** Optional plain-text bean note. */
  bean?: string;
  /** Optional plain-text grind-size note. */
  grindSize?: string;
  /** Optional rating, 1–5. */
  rating?: number;
  params: RecipeParams;
  /**
   * `Date.now()` at save time. Optional because records saved before this
   * field existed lack it — readers must tolerate its absence (render no
   * date, sort those records last).
   */
  createdAt?: number;
}

/** Calculator defaults — the fallback for any missing / out-of-range param. */
export const DEFAULT_PARAMS: RecipeParams = {
  dose: 20,
  ratio: 15,
  acidity: 0,
  strengthPours: 3,
};

/** Inclusive valid ranges, matching the calculator inputs / 4:6 engine. */
export const DOSE_RANGE = [8, 60] as const;
export const RATIO_RANGE = [12, 18] as const;
export const ACIDITY_RANGE = [-1, 1] as const;
export const STRENGTH_RANGE = [1, 4] as const;

/**
 * Coerce one numeric field: drop non-finite values to `fallback`, then clamp
 * into `[lo, hi]`. `strengthPours` additionally rounds to a whole pour. Pure.
 */
function coerce(
  v: number | undefined,
  [lo, hi]: readonly [number, number],
  fallback: number,
  round = false,
): number {
  const n = finiteOr(v ?? fallback, fallback);
  return clamp(round ? Math.round(n) : n, lo, hi);
}

/**
 * Clamp an arbitrary (possibly partial / out-of-range / non-finite) params-like
 * object into a valid {@link RecipeParams}, falling back per field to the
 * calculator defaults. The single guard every entry point (URL parse, stored
 * data, caller input) funnels through.
 *
 * Accepts only `Partial<RecipeParams>` — this module's validation is deliberately
 * decoupled from {@link RecipeInput} in `four-six.ts`. A caller holding a
 * `RecipeInput` (or any other params-like shape) maps the four fields explicitly,
 * so a new required field on an upstream type can never silently bypass this guard.
 * Pure.
 */
export function clampParams(p: Partial<RecipeParams>): RecipeParams {
  return {
    dose: coerce(p.dose, DOSE_RANGE, DEFAULT_PARAMS.dose),
    ratio: coerce(p.ratio, RATIO_RANGE, DEFAULT_PARAMS.ratio),
    acidity: coerce(p.acidity, ACIDITY_RANGE, DEFAULT_PARAMS.acidity),
    strengthPours: coerce(
      p.strengthPours,
      STRENGTH_RANGE,
      DEFAULT_PARAMS.strengthPours,
      true,
    ),
  };
}

/**
 * Parse recipe params from a URL query (a `?dose=…&ratio=…` string, a bare
 * `dose=…` string, or a `URLSearchParams`). The `strengthPours` field reads from
 * the `strength` query key (the URL shape in the spec). Missing or out-of-range
 * values fall back to the calculator defaults via {@link clampParams}; never
 * throws. Pure.
 */
export function parseRecipeParams(search: string | URLSearchParams): RecipeParams {
  const sp =
    typeof search === "string" ? new URLSearchParams(search) : search;
  // A missing OR blank value is "unset" → undefined → the field's default. We
  // must short-circuit blanks BEFORE Number(), because `Number('') === 0` is a
  // finite in-range-ish value that clampParams would silently keep (e.g. an
  // empty `ratio=` would clamp to 12 instead of falling back to the default 15).
  // A non-numeric string (`Number('abc') === NaN`) is left to clampParams.
  const num = (key: string): number | undefined => {
    const raw = sp.get(key);
    if (raw == null || raw.trim() === "") return undefined;
    return Number(raw);
  };
  return clampParams({
    dose: num("dose"),
    ratio: num("ratio"),
    acidity: num("acidity"),
    strengthPours: num("strength"),
  });
}

/**
 * Serialize params to a query string (no leading `?`) using the spec's URL key
 * shape (`dose`, `ratio`, `acidity`, `strength`). Params are clamped first so a
 * caller can't emit an out-of-range URL. The single builder for `/brew` and
 * calculator (`/?…`) links so parse + build stay in lockstep.
 */
export function recipeParamsToQuery(params: RecipeParams): string {
  const p = clampParams(params);
  return new URLSearchParams({
    dose: String(p.dose),
    ratio: String(p.ratio),
    acidity: String(p.acidity),
    strength: String(p.strengthPours),
  }).toString();
}

/** True only in the browser; gates every localStorage access for SSR safety. */
function hasStorage(): boolean {
  return typeof window !== "undefined";
}

/**
 * Read + JSON-parse a key, returning `null` on SSR, a missing key, malformed
 * JSON, or any thrown access error. The shared safe-read primitive.
 */
function readJSON<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON-stringify + write a key. No-op on SSR; swallows quota / access errors. */
function writeJSON(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore (quota / private-mode / disabled storage) */
  }
}

/**
 * Read the implicit last brew, or `null` if none / corrupt / on the server. The
 * stored params are re-clamped on read so a hand-edited or legacy value can't
 * feed an out-of-range recipe downstream.
 */
export function getLastBrew(): LastBrew | null {
  const raw = readJSON<Partial<LastBrew>>(LAST_BREW_KEY);
  // `readJSON` is an `as` cast, not a runtime check — validate the shape before
  // trusting it. A missing `params` or a non-number `brewedAt` means corrupt /
  // legacy data: drop it (return null) rather than feed a malformed brew on.
  if (
    !raw ||
    typeof raw !== "object" ||
    !raw.params ||
    typeof raw.brewedAt !== "number"
  ) {
    return null;
  }
  return {
    params: clampParams(raw.params),
    brewedAt: finiteOr(raw.brewedAt, Date.now()),
  };
}

/** Overwrite the single last-brew slot with the just-completed brew's params. */
export function setLastBrew(params: RecipeParams): void {
  const brew: LastBrew = { params: clampParams(params), brewedAt: Date.now() };
  writeJSON(LAST_BREW_KEY, brew);
}

/**
 * Read all saved recipes (newest writes preserved in stored order), or `[]` on
 * SSR / missing / corrupt data. Drops any entry that isn't a well-formed record
 * (no id, no non-empty `name`, no params) so one bad item can't break the whole
 * list, and re-clamps each entry's params.
 */
export function getRecipes(): SavedRecipe[] {
  const raw = readJSON<unknown>(RECIPES_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is SavedRecipe =>
        !!r &&
        typeof r === "object" &&
        typeof (r as SavedRecipe).id === "string" &&
        typeof (r as SavedRecipe).name === "string" &&
        (r as SavedRecipe).name.trim() !== "" &&
        !!(r as SavedRecipe).params,
    )
    .map((r) => ({ ...r, params: clampParams(r.params) }));
}

/** Input to {@link addRecipe} — the caller supplies everything but `id`/`createdAt`. */
export interface AddRecipeInput {
  name: string;
  bean?: string;
  grindSize?: string;
  rating?: number;
  params: RecipeParams;
}

/**
 * Append a new saved recipe (generating its `id` + `createdAt`), persist, and
 * return the created record. Optional metadata fields are only written when
 * provided, so a recipe stays minimal. `params` are clamped on the way in; the
 * stored `name` is trimmed.
 *
 * Unlike the read accessors, this **throws** rather than silently no-op'ing, so a
 * caller can never receive a record that was never persisted:
 *  - off-DOM (SSR) — `localStorage` is unavailable, so there is nothing to write to;
 *  - empty `name` (after trim) — `name` is required (the UI form enforces it, so a
 *    blank here is a programmer error, not a normal path).
 */
export function addRecipe(input: AddRecipeInput): SavedRecipe {
  if (!hasStorage()) {
    throw new Error("addRecipe: localStorage is unavailable (called off-DOM)");
  }
  const name = input.name.trim();
  if (name === "") {
    throw new Error("addRecipe: name is required");
  }
  const recipe: SavedRecipe = {
    id: crypto.randomUUID(),
    name,
    ...(input.bean !== undefined && { bean: input.bean }),
    ...(input.grindSize !== undefined && { grindSize: input.grindSize }),
    ...(input.rating !== undefined && { rating: input.rating }),
    params: clampParams(input.params),
    createdAt: Date.now(),
  };
  writeJSON(RECIPES_KEY, [...getRecipes(), recipe]);
  notifyRecipesChanged();
  return recipe;
}

/** Remove a saved recipe by id and persist. No-op if the id isn't present. */
export function deleteRecipe(id: string): void {
  writeJSON(
    RECIPES_KEY,
    getRecipes().filter((r) => r.id !== id),
  );
  notifyRecipesChanged();
}
