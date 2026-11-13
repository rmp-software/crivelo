"use client";

import { useSyncExternalStore } from "react";
import { content } from "./content";

/**
 * Device-local user state — the only state Salis persists.
 *
 * v1 has no backend: Juliana's content is a committed module (see `content.ts`)
 * and everything the *user* decides lives here, in one `localStorage` key. This
 * module is the single seam the Phase 2 screens write through (S0 onboarding
 * sets `drops_per_ml` and the first inventory; S5 toggles ownership), so the
 * rules live in ONE place:
 *
 *  - **One state, many consumers.** The state is a module-level object read
 *    through `useSyncExternalStore`, not a `useState` per hook call. A tab bar,
 *    a screen and a badge mounted at once all read the same snapshot, and a
 *    write in S5 re-renders the badge in S2 immediately. Modelled on
 *    `apps/crivelo-web/lib/recipes-store.ts`, which solves the same
 *    "localStorage-backed client state, no backend" problem with an explicit
 *    `subscribe` + a native `storage` listener; `useSyncExternalStore` is the
 *    stdlib expression of that idea, so no custom same-window event is needed —
 *    module listeners already cover every consumer in this JS context.
 *  - **SSR-safe.** Next renders these screens on the server, where `window` does
 *    not exist, and a private window can throw on access. Every read returns the
 *    defaults instead of crashing; every write is a no-op instead of throwing.
 *    `getServerSnapshot` hands React the defaults for the server render *and*
 *    the hydration render, so the stored state can be read eagerly on the client
 *    without a hydration mismatch.
 *  - **Never trusts what it reads — or what it is told to write.**
 *    {@link sanitizeDeviceState} gates BOTH directions — reads and writes — and
 *    it is the only door in: nothing exported here writes storage directly, so
 *    every persisted byte has passed through it. Corrupt JSON, a hand-edited
 *    value, a concentrate id a later content import renamed, or a screen
 *    passing a bad value is dropped. A `drops_per_ml` of `0` or `NaN` would
 *    poison every drop count on screen — the hero number of the whole app — so
 *    it falls back to the content default.
 *  - **Ownership and prep date cannot diverge.** The gate enforces the pairing
 *    invariant `id ∈ owned_concentrate_ids ⟺ id ∈ prepared_on`, not just each
 *    field's own shape: a prep date is dropped unless the concentrate survives
 *    sanitisation as owned. Validating the two fields independently is what
 *    previously let a dated-but-unowned concentrate reach storage, leaving the
 *    shelf-life warning (RMP-256) counting from a bottle nobody has.
 *  - **Writes merge against the device, never a render's stale closure.** Every
 *    action re-reads storage, merges, sanitises, persists and notifies, so two
 *    writes in one tick (or a write from a tab another tab has moved on from)
 *    cannot clobber an unrelated field. That re-read is a synchronous parse per
 *    write: negligible at tap speed, but NOT at frame rate — a drag-style
 *    interaction (S6's "move the drops and watch the dot") must hold the value
 *    in local component state and commit once on release, never per pointermove.
 *  - **A failed write is never silent.** Quota, or a private window that throws:
 *    every action returns `false` when the state did not reach storage, so a
 *    screen can say "Não foi possível salvar." instead of showing a change that
 *    the next refresh reverts.
 *  - **Content owns the defaults.** `drops_per_ml` starts at
 *    `guards.default_drops_per_ml` from her sheet, never a hardcoded 20.
 */

/** The one localStorage key. Bump the suffix if the shape ever breaks. */
const STORAGE_KEY = "salis-device-v1";

/**
 * 1 L is the plan's worked example and the volume the course teaches with. Not a
 * guard key: it is a remembered UI choice, not a chemistry threshold.
 */
export const DEFAULT_WATER_ML = 1000;

export interface DeviceState {
  /** Concentrates the user has on the shelf, by `Concentrate.id`. */
  owned_concentrate_ids: string[];
  /**
   * When each concentrate was prepared, as the ISO date the user picked
   * (`YYYY-MM-DD`), keyed by concentrate id. Feeds the shelf-life warning.
   */
  prepared_on: Record<string, string>;
  /** This device's dropper calibration — drops per mL. */
  drops_per_ml: number;
  /** The last water volume the user dosed for, in mL. */
  water_ml: number;
  /** Set once S0 finishes, so a returning user never sees onboarding again. */
  onboarding_done: boolean;
}

/**
 * A fresh device's state. A function, so no caller can mutate a shared object.
 *
 * TRIPWIRE: this must allocate a NEW object on every call. {@link SERVER_SNAPSHOT}
 * is one of those allocations and `loaded` is `state !== SERVER_SNAPSHOT`, so
 * memoising this to "stop allocating" would alias the singleton and pin `loaded`
 * to `false` forever.
 */
export function defaultDeviceState(): DeviceState {
  return {
    owned_concentrate_ids: [],
    prepared_on: {},
    drops_per_ml: content.guards.default_drops_per_ml,
    water_ml: DEFAULT_WATER_ML,
    onboarding_done: false,
  };
}

const KNOWN_CONCENTRATE_IDS = new Set(content.concentrates.map((c) => c.id));

/** A stored number is only usable if it is finite and positive — it divides. */
function positiveOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

/** Today on the *user's* calendar, as `YYYY-MM-DD`. Not UTC: a prep date is
 *  what the kitchen clock said, and UTC can already be tomorrow. */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * A prep date is usable only if it is a real `YYYY-MM-DD` calendar date that is
 * not in the future. Shelf life (RMP-256) counts *forward* from it: `"2099-01-01"`
 * would silently never expire and `"not-a-date"` would render `NaN` days.
 *
 * The round-trip is the whole check. A date-only string parses as UTC midnight,
 * so only a real `YYYY-MM-DD` prints back identically — `"2026-02-31"` parses
 * (V8 rolls it over to March 3) and `"2026-11-02T10:00:00Z"` parses, and both
 * fail the comparison. Fixing the format that way is also what makes the
 * not-in-the-future test exact: these strings sort lexicographically, so there
 * is no timezone arithmetic to get wrong.
 */
function isUsablePrepDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  return (
    new Date(parsed).toISOString().slice(0, 10) === value && value <= todayIso()
  );
}

/**
 * Coerce anything — storage, or a patch from a screen — into a valid
 * {@link DeviceState}, field by field, falling back to the defaults. The single
 * invariant gate: nothing reaches React or localStorage without passing through
 * here. Exported for the tests. Pure.
 */
export function sanitizeDeviceState(raw: unknown): DeviceState {
  const defaults = defaultDeviceState();
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Partial<DeviceState>;

  // Content is the authority on which concentrates exist: an id her next import
  // renames would otherwise sit in the inventory forever, owned and unreachable.
  const owned = Array.isArray(r.owned_concentrate_ids)
    ? [...new Set(r.owned_concentrate_ids)].filter(
        (id): id is string => typeof id === "string" && KNOWN_CONCENTRATE_IDS.has(id),
      )
    : defaults.owned_concentrate_ids;

  // Ownership is sanitised FIRST because the prep dates are then filtered
  // against the surviving ids: a prep date means "I made this bottle on this
  // day", which is only meaningful for something on the shelf. Checking the two
  // fields independently is what let a dated-but-unowned concentrate through.
  const ownedSet = new Set(owned);

  const prepared_on: Record<string, string> = {};
  if (r.prepared_on && typeof r.prepared_on === "object") {
    for (const [id, date] of Object.entries(r.prepared_on)) {
      if (ownedSet.has(id) && isUsablePrepDate(date)) {
        prepared_on[id] = date;
      }
    }
  }

  return {
    owned_concentrate_ids: owned,
    prepared_on,
    drops_per_ml: positiveOr(r.drops_per_ml, defaults.drops_per_ml),
    water_ml: positiveOr(r.water_ml, defaults.water_ml),
    onboarding_done: r.onboarding_done === true,
  };
}

/** The browser's localStorage, or `null` on the server / when access throws. */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode or storage disabled — degrade to no persistence.
    return null;
  }
}

/**
 * Read this device's state. Returns the defaults on the server, on a first
 * launch, and on anything unparseable. Never throws.
 */
export function readDeviceState(): DeviceState {
  const store = storage();
  if (!store) return defaultDeviceState();
  try {
    const raw = store.getItem(STORAGE_KEY);
    return sanitizeDeviceState(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultDeviceState();
  }
}

/**
 * Persist an already-sanitised state. Module-private on purpose: {@link commit}
 * is the only caller, and it sanitises first. An exported raw write would
 * type-check `{ ...state, drops_per_ml: 0 }` straight onto the device and divide
 * a zero into every drop count — exactly what this module exists to prevent.
 *
 * Returns whether the state actually reached storage. `false` means this session
 * is in-memory only: the screen has the change, a refresh will not.
 */
function persist(state: DeviceState): boolean {
  const store = storage();
  // Server render, or a window that denies storage entirely. Nothing to log:
  // this is the documented degraded mode, not a failure of this write.
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    // Quota, or Safari private mode. The in-memory state still drives this
    // session, but it is gone on refresh — so make it observable rather than
    // letting the UI claim a save that did not happen.
    console.warn(`[salis] could not persist ${STORAGE_KEY}`, error);
    return false;
  }
}

/* ------------------------------------------------------------------------- *
 * The module-level store: one state, one set of listeners.
 * ------------------------------------------------------------------------- */

/**
 * The server/hydration snapshot. A single frozen object, because React calls
 * `getServerSnapshot` repeatedly and a fresh object each time would loop — and
 * because its identity is how {@link useDeviceStore} knows a render is still the
 * hydration render (see `loaded`).
 *
 * Frozen all the way down, not just at the top: this one object is handed to
 * every hydration render in the process, so a stray
 * `state.owned_concentrate_ids.push(id)` on a pre-hydration state would corrupt
 * the defaults for every render after it.
 */
const SERVER_SNAPSHOT: DeviceState = (() => {
  const defaults = defaultDeviceState();
  Object.freeze(defaults.owned_concentrate_ids);
  Object.freeze(defaults.prepared_on);
  return Object.freeze(defaults);
})();

/** The live snapshot, read from storage on first access. */
let snapshot: DeviceState | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  // A copy: a listener may subscribe or unsubscribe synchronously while it runs
  // (React does, on an unmount triggered by a write), and mutating the live Set
  // mid-iteration would skip the listeners after it.
  for (const listener of [...listeners]) listener();
}

/**
 * Another tab wrote the key: adopt its value and re-render. Installed once, with
 * the first subscriber, so N mounted consumers resync once rather than N times.
 * A same-window write needs no event — it calls {@link notify} directly.
 */
function handleStorageEvent(event: StorageEvent): void {
  // `key === null` is a `clear()`; treat it as a change. Ignore other keys.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = readDeviceState();
  notify();
}

/** Subscribe to every change — same-window writes and other tabs alike. */
export function subscribe(onChange: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/** The current state. Stable by identity between writes, as React requires. */
export function getSnapshot(): DeviceState {
  snapshot ??= readDeviceState();
  return snapshot;
}

/**
 * Exported for tests, which need a fresh module state per case. Also drops any
 * listener a failed test leaked, so one failure cannot cascade into the cases
 * after it.
 */
export function resetSnapshotForTests(): void {
  snapshot = null;
  listeners.clear();
}

/**
 * The one write path. `patch` receives the state as it is **on the device right
 * now** — storage is re-read rather than trusting the in-memory snapshot, so a
 * second write in the same tick, or a write from a tab another tab has already
 * moved past, merges instead of clobbering. The result is sanitised before it is
 * persisted or shown.
 *
 * Returns whether the new state reached storage — see {@link persist}. The
 * snapshot and the listeners are updated either way, so the session stays
 * usable, but the caller is told when the device did not keep it.
 */
function commit(patch: (prev: DeviceState) => Partial<DeviceState>): boolean {
  const prev = storage() ? readDeviceState() : getSnapshot();
  const next = sanitizeDeviceState({ ...prev, ...patch(prev) });
  snapshot = next;
  const saved = persist(next);
  notify();
  return saved;
}

/* ------------------------------------------------------------------------- *
 * Actions — the intended surface. Plain module functions, so they are stable by
 * identity (no `useCallback`, no dependency arrays), callable outside React, and
 * the toggle/spread logic exists ONCE instead of at nine call sites.
 *
 * Each returns whether the write reached storage. A screen with nowhere to put a
 * failure may ignore it; one that can should surface "Não foi possível salvar."
 * ------------------------------------------------------------------------- */

/** Put a concentrate on the shelf, or take it off (S5). Unknown ids are dropped. */
export function toggleOwned(id: string): boolean {
  return commit((prev) => ({
    owned_concentrate_ids: prev.owned_concentrate_ids.includes(id)
      ? prev.owned_concentrate_ids.filter((owned) => owned !== id)
      : [...prev.owned_concentrate_ids, id],
  }));
}

/** Record when a concentrate was prepared, as `YYYY-MM-DD` (S4/S5). */
export function setPreparedOn(id: string, isoDate: string): boolean {
  return commit((prev) => ({
    prepared_on: { ...prev.prepared_on, [id]: isoDate },
  }));
}

/**
 * S4's "✓ Tenho este concentrado" is ONE user action that means two fields: the
 * concentrate goes on the shelf AND today is its prep date. One {@link commit},
 * so it is one write, one persist and one re-render — and so the "own it and
 * date it" pairing lives here instead of being re-derived at every call site
 * that offers the gesture.
 *
 * Idempotent on the ownership half: tapping it again re-dates the concentrate
 * rather than toggling it off the shelf, which is what the copy promises.
 */
export function markPrepared(id: string, isoDate: string = todayIso()): boolean {
  // The pairing has to survive sanitisation, which validates ownership and
  // `prepared_on` INDEPENDENTLY: a known id with an unusable date would keep the
  // ownership half and silently drop the date half, leaving the concentrate on
  // the shelf with nothing for the shelf-life warning to count from. Falling
  // back to today keeps the pair together — the gesture means "I prepared this".
  const safeDate = isUsablePrepDate(isoDate) ? isoDate : todayIso();
  return commit((prev) => ({
    owned_concentrate_ids: prev.owned_concentrate_ids.includes(id)
      ? prev.owned_concentrate_ids
      : [...prev.owned_concentrate_ids, id],
    prepared_on: { ...prev.prepared_on, [id]: safeDate },
  }));
}

/** This device's dropper calibration, in drops per mL (S0). */
export function setCalibration(dropsPerMl: number): boolean {
  return commit(() => ({ drops_per_ml: dropsPerMl }));
}

/** The water volume the user is dosing for, in mL (S1/S2). */
export function setWaterMl(ml: number): boolean {
  return commit(() => ({ water_ml: ml }));
}

/** S0 is done; a returning user goes straight to the recipes. */
export function completeOnboarding(): boolean {
  return commit(() => ({ onboarding_done: true }));
}

/**
 * Low-level escape hatch for a patch the named actions do not cover (S0 writes
 * calibration + inventory + `onboarding_done` as one step). Prefer an action.
 */
export function updateDeviceState(patch: Partial<DeviceState>): boolean {
  return commit(() => patch);
}

export interface DeviceStore {
  state: DeviceState;
  /**
   * False only on the hydration render, where the snapshot is still the server
   * defaults. A screen that branches on stored state (S0: onboard or not) waits
   * for it instead of flashing the wrong branch for a frame.
   *
   * Computed by identity against {@link SERVER_SNAPSHOT} — see the tripwire on
   * {@link defaultDeviceState} for what must stay true for that to work.
   */
  loaded: boolean;
}

/**
 * The server and hydration render's state. Exported so a test can assert the
 * identity `loaded` rests on; screens use {@link useDeviceStore}.
 */
export function getServerSnapshot(): DeviceState {
  return SERVER_SNAPSHOT;
}

/**
 * React access to the device state. Every consumer gets the same snapshot and
 * re-renders together; writes go through the exported actions, not through a
 * setter handed back here.
 *
 * The returned wrapper is a fresh literal per render — destructure it on the
 * spot (`const { state, loaded } = useDeviceStore()`, as every consumer does)
 * rather than passing it into a memo dependency. `state` is the stable identity.
 */
export function useDeviceStore(): DeviceStore {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { state, loaded: state !== SERVER_SNAPSHOT };
}
