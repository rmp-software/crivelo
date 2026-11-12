import { afterEach, describe, expect, it, vi } from "vitest";
import { content } from "../content";
import {
  DEFAULT_WATER_ML,
  type DeviceState,
  completeOnboarding,
  defaultDeviceState,
  getServerSnapshot,
  getSnapshot,
  markPrepared,
  readDeviceState,
  resetSnapshotForTests,
  sanitizeDeviceState,
  setCalibration,
  setPreparedOn,
  setWaterMl,
  subscribe,
  toggleOwned,
  updateDeviceState,
} from "../device-store";
// The whole module surface, to assert what is NOT on it.
import * as store from "../device-store";

/**
 * Store tests run in the `node` environment, like the engine's — no jsdom.
 *
 * The store touches exactly two browser APIs — `window.localStorage` and the
 * `storage` event — so an in-memory stub on `globalThis` exercises the real
 * read/write/resync paths without pulling a DOM implementation into the
 * dependency tree. Deleting the stub is also the only way to test the server
 * case, which is the one that must never throw.
 *
 * The React binding (`useDeviceStore`) is a two-line delegation to `subscribe` +
 * `getSnapshot`, so `mountConsumer` below mimics exactly what
 * `useSyncExternalStore` does with that pair. The real React-level proof that
 * two mounted consumers share one snapshot is the browser check in the task
 * evidence, not a renderer added to this app's dependency tree.
 */
const globals = globalThis as unknown as {
  window?: {
    localStorage: Storage;
    addEventListener: (type: string, fn: (e: unknown) => void) => void;
    removeEventListener: (type: string, fn: (e: unknown) => void) => void;
  };
};

const STORAGE_KEY = "salis-device-v1";

/** Listeners the stub `window` is holding, so a test can fire a `storage` event. */
let domListeners: Array<(e: unknown) => void> = [];

function installStorage(seed?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (seed !== undefined) map.set(STORAGE_KEY, seed);
  domListeners = [];
  globals.window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      removeItem: (key: string) => void map.delete(key),
      clear: () => map.clear(),
      key: (index: number) => [...map.keys()][index] ?? null,
      get length() {
        return map.size;
      },
    } as Storage,
    addEventListener: (type, fn) => {
      if (type === "storage") domListeners.push(fn);
    },
    removeEventListener: (type, fn) => {
      if (type === "storage") domListeners = domListeners.filter((f) => f !== fn);
    },
  };
  return map;
}

/** Fire the native `storage` event the way another tab's write would. */
function fireStorageEvent(key: string | null): void {
  for (const listener of [...domListeners]) listener({ key });
}

/** Make `window` throw on access, as a locked-down private window does. */
function installThrowingStorage(): void {
  globals.window = {
    get localStorage(): Storage {
      throw new Error("access denied");
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as NonNullable<typeof globals.window>;
}

/**
 * What `useSyncExternalStore` does with `subscribe`/`getSnapshot`: read on
 * mount, and re-read on every notification. One per "mounted component".
 */
function mountConsumer(): {
  rendered: DeviceState[];
  current: () => DeviceState;
  unmount: () => void;
} {
  const rendered: DeviceState[] = [getSnapshot()];
  const unmount = subscribe(() => void rendered.push(getSnapshot()));
  return {
    rendered,
    current: () => rendered[rendered.length - 1],
    unmount,
  };
}

/** The ids and dates the tests lean on, taken from the content, never invented. */
const [FIRST, SECOND] = content.concentrates.map((c) => c.id);

afterEach(() => {
  delete globals.window;
  domListeners = [];
  resetSnapshotForTests();
});

describe("defaults", () => {
  it("takes drops_per_ml from the content guards, not a hardcoded value", () => {
    expect(defaultDeviceState().drops_per_ml).toBe(
      content.guards.default_drops_per_ml,
    );
  });

  it("starts empty, un-onboarded and at 1 L", () => {
    expect(defaultDeviceState()).toEqual({
      owned_concentrate_ids: [],
      prepared_on: {},
      drops_per_ml: content.guards.default_drops_per_ml,
      water_ml: DEFAULT_WATER_ML,
      onboarding_done: false,
    });
  });

  it("returns a fresh object each call, so a caller cannot mutate the next one", () => {
    const first = defaultDeviceState();
    first.owned_concentrate_ids.push(FIRST);
    expect(defaultDeviceState().owned_concentrate_ids).toEqual([]);
  });
});

describe("persistence", () => {
  it("round-trips a state through storage", () => {
    installStorage();
    const state = {
      ...defaultDeviceState(),
      owned_concentrate_ids: [FIRST, SECOND],
      prepared_on: { [FIRST]: "2026-11-01" },
      drops_per_ml: 22,
      water_ml: 500,
      onboarding_done: true,
    };
    // Through the real write path: there is no exported raw write to use.
    updateDeviceState(state);
    expect(readDeviceState()).toEqual(state);
  });

  it("returns the defaults on a first launch", () => {
    installStorage();
    expect(readDeviceState()).toEqual(defaultDeviceState());
  });

  it("returns the defaults when the stored value is not JSON", () => {
    installStorage("{not json");
    expect(readDeviceState()).toEqual(defaultDeviceState());
  });

  it("returns the defaults off-DOM instead of throwing", () => {
    expect(readDeviceState()).toEqual(defaultDeviceState());
  });

  it("is a no-op off-DOM instead of throwing", () => {
    expect(() => setWaterMl(500)).not.toThrow();
  });

  it("survives storage that throws on access", () => {
    installThrowingStorage();
    expect(readDeviceState()).toEqual(defaultDeviceState());
    expect(() => setWaterMl(500)).not.toThrow();
  });
});

describe("a write that cannot reach storage says so", () => {
  it("returns true when the write lands", () => {
    installStorage();
    expect(setWaterMl(2000)).toBe(true);
  });

  it("returns false and warns when setItem throws, keeping the session usable", () => {
    const map = installStorage();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Quota, or Safari private mode: access works, the write does not.
    globals.window!.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    expect(setWaterMl(2000)).toBe(false);

    expect(warn).toHaveBeenCalledOnce();
    expect(getSnapshot().water_ml).toBe(2000); // the session still works
    expect(map.has(STORAGE_KEY)).toBe(false); // but the device kept nothing
    warn.mockRestore();
  });

  it("returns false with no storage at all, instead of claiming a save", () => {
    installThrowingStorage();
    expect(setWaterMl(2000)).toBe(false);
    expect(toggleOwned(FIRST)).toBe(false);
    expect(markPrepared(FIRST)).toBe(false);
  });
});

describe("no exported path can persist an unsanitised state", () => {
  it("exposes no raw write", () => {
    // `writeDeviceState` was exported and skipped sanitizeDeviceState entirely:
    // `{ ...state, drops_per_ml: 0 }` type-checked straight onto the device.
    expect(store).not.toHaveProperty("writeDeviceState");
  });

  it("leaves storage sanitise-stable after every exported write", () => {
    const poison = {
      drops_per_ml: 0,
      water_ml: -1,
      owned_concentrate_ids: ["gone-from-content"],
      prepared_on: { [FIRST]: "2099-01-01" },
      onboarding_done: "yes",
    } as unknown as DeviceState;

    const writes: Array<[string, () => unknown]> = [
      ["updateDeviceState", () => updateDeviceState(poison)],
      ["setCalibration", () => setCalibration(0)],
      ["setWaterMl", () => setWaterMl(-1)],
      ["setPreparedOn", () => setPreparedOn(FIRST, "2099-01-01")],
      ["markPrepared", () => markPrepared(FIRST, "2099-01-01")],
      ["toggleOwned", () => toggleOwned("gone-from-content")],
      ["completeOnboarding", () => completeOnboarding()],
    ];

    for (const [name, write] of writes) {
      const map = installStorage();
      resetSnapshotForTests();
      write();
      const stored = JSON.parse(map.get(STORAGE_KEY) ?? "{}");
      // Sanitisation is idempotent, so a stored value it would not change is a
      // value that already went through it.
      expect(stored, name).toEqual(sanitizeDeviceState(stored));
      expect(stored.drops_per_ml, name).toBe(content.guards.default_drops_per_ml);
      expect(stored.water_ml, name).toBeGreaterThan(0);
    }
  });

  it("never persists a prep date for a concentrate that is not owned", () => {
    // The half of the pairing the sanitise-stable check above cannot see: a
    // dated-but-unowned concentrate IS a shape-valid state, so only asserting
    // the two fields against each other catches it.
    const writes: Array<[string, () => unknown]> = [
      [
        "updateDeviceState",
        () =>
          updateDeviceState({
            owned_concentrate_ids: [SECOND],
            prepared_on: { [FIRST]: "2026-01-02", [SECOND]: "2026-01-03" },
          }),
      ],
      ["setPreparedOn", () => setPreparedOn(FIRST, "2026-01-02")],
      ["markPrepared", () => markPrepared(FIRST, "2026-01-02")],
      ["toggleOwned after a date", () => void (markPrepared(FIRST), toggleOwned(FIRST))],
      ["setCalibration", () => setCalibration(25)],
      ["setWaterMl", () => setWaterMl(500)],
      ["completeOnboarding", () => completeOnboarding()],
    ];

    for (const [name, write] of writes) {
      const map = installStorage();
      resetSnapshotForTests();
      write();
      for (const state of [
        getSnapshot(),
        JSON.parse(map.get(STORAGE_KEY) ?? "{}") as DeviceState,
      ]) {
        expect(
          Object.keys(state.prepared_on ?? {}).filter(
            (id) => !(state.owned_concentrate_ids ?? []).includes(id),
          ),
          name,
        ).toEqual([]);
      }
    }
  });
});

describe("loaded / the server snapshot", () => {
  it("is one deeply frozen object on every call", () => {
    const server = getServerSnapshot();
    expect(getServerSnapshot()).toBe(server); // a fresh object per call would loop
    expect(Object.isFrozen(server)).toBe(true);
    // Deep, not shallow: this object is handed to every hydration render in the
    // process, so a push into its array would corrupt the defaults for good.
    expect(Object.isFrozen(server.owned_concentrate_ids)).toBe(true);
    expect(Object.isFrozen(server.prepared_on)).toBe(true);
    expect(() => server.owned_concentrate_ids.push(FIRST)).toThrow();
    expect(defaultDeviceState().owned_concentrate_ids).toEqual([]);
  });

  it("never returns the server snapshot from a read, so `loaded` can flip", () => {
    // `loaded` is `state !== SERVER_SNAPSHOT`. If a read ever handed that
    // identity back — e.g. a "stop allocating" cleanup to defaultDeviceState() —
    // a screen branching on stored state would wait for hydration forever.
    const installs: Array<[string, () => void]> = [
      ["first launch", () => void installStorage()],
      ["stored state", () => void installStorage(JSON.stringify(defaultDeviceState()))],
      ["storage throws", installThrowingStorage],
      [
        "no DOM",
        () => {
          delete globals.window;
        },
      ],
    ];

    for (const [name, install] of installs) {
      resetSnapshotForTests();
      delete globals.window;
      install();
      expect(getSnapshot(), name).not.toBe(getServerSnapshot());
      expect(getSnapshot(), name).toEqual(defaultDeviceState());
    }
  });
});

describe("sanitizeDeviceState", () => {
  it("falls back to the defaults for a non-object", () => {
    expect(sanitizeDeviceState(null)).toEqual(defaultDeviceState());
    expect(sanitizeDeviceState("nope")).toEqual(defaultDeviceState());
  });

  it("keeps only concentrate ids that exist in the content", () => {
    const state = sanitizeDeviceState({
      owned_concentrate_ids: [FIRST, "gone-from-content", 7],
    });
    expect(state.owned_concentrate_ids).toEqual([FIRST]);
  });

  it("de-duplicates owned ids", () => {
    expect(
      sanitizeDeviceState({ owned_concentrate_ids: [SECOND, SECOND] })
        .owned_concentrate_ids,
    ).toEqual([SECOND]);
  });

  it("drops prep dates for unknown concentrates and non-string dates", () => {
    expect(
      sanitizeDeviceState({
        owned_concentrate_ids: [FIRST, SECOND],
        prepared_on: { [SECOND]: "2026-11-02", gone: "2026-11-02", [FIRST]: 5 },
      }).prepared_on,
    ).toEqual({ [SECOND]: "2026-11-02" });
  });

  it("drops a prep date for a concentrate that is not owned", () => {
    // A prep date means "I made this bottle on this day": it is meaningless for
    // something that is not on the shelf. The gate enforces the pairing, so no
    // caller has to.
    expect(
      sanitizeDeviceState({
        owned_concentrate_ids: [SECOND],
        prepared_on: { [FIRST]: "2026-01-02", [SECOND]: "2026-01-03" },
      }).prepared_on,
    ).toEqual({ [SECOND]: "2026-01-03" });
  });

  it("drops a prep date that is not a real past YYYY-MM-DD", () => {
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    for (const bad of [
      "2099-01-01",
      tomorrow,
      "not-a-date",
      "2026-02-31",
      "01/11/2026",
      "2026-11-02T10:00:00Z",
    ]) {
      expect(
        sanitizeDeviceState({
          owned_concentrate_ids: [FIRST],
          prepared_on: { [FIRST]: bad },
        }).prepared_on,
      ).toEqual({});
    }
    expect(
      sanitizeDeviceState({
        owned_concentrate_ids: [FIRST],
        prepared_on: { [FIRST]: "2026-01-02" },
      }).prepared_on,
    ).toEqual({ [FIRST]: "2026-01-02" });
  });

  it("accepts today, on the local calendar", () => {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    expect(
      sanitizeDeviceState({
        owned_concentrate_ids: [FIRST],
        prepared_on: { [FIRST]: today },
      }).prepared_on,
    ).toEqual({ [FIRST]: today });
  });

  it("rejects a drops_per_ml that would poison every drop count", () => {
    const fallback = content.guards.default_drops_per_ml;
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, "20", null]) {
      expect(sanitizeDeviceState({ drops_per_ml: bad }).drops_per_ml).toBe(fallback);
    }
    expect(sanitizeDeviceState({ drops_per_ml: 25 }).drops_per_ml).toBe(25);
  });

  it("rejects a non-positive water volume", () => {
    expect(sanitizeDeviceState({ water_ml: 0 }).water_ml).toBe(DEFAULT_WATER_ML);
    expect(sanitizeDeviceState({ water_ml: 1500 }).water_ml).toBe(1500);
  });

  it("treats anything but true as not onboarded", () => {
    expect(sanitizeDeviceState({ onboarding_done: "yes" }).onboarding_done).toBe(false);
    expect(sanitizeDeviceState({ onboarding_done: true }).onboarding_done).toBe(true);
  });
});

describe("one shared snapshot", () => {
  it("hands every consumer the same object, by identity", () => {
    installStorage();
    const a = mountConsumer();
    const b = mountConsumer();
    expect(a.current()).toBe(b.current());
    a.unmount();
    b.unmount();
  });

  it("re-renders a sibling consumer on another consumer's write", () => {
    installStorage();
    const screen = mountConsumer();
    const badge = mountConsumer();

    toggleOwned(FIRST);

    // The badge saw the write without remounting or re-reading storage itself.
    expect(badge.rendered).toHaveLength(2);
    expect(badge.current().owned_concentrate_ids).toEqual([FIRST]);
    expect(screen.current()).toBe(badge.current());
    screen.unmount();
    badge.unmount();
  });

  it("gives a new object identity per write, so React sees the change", () => {
    installStorage();
    const consumer = mountConsumer();
    const before = consumer.current();
    setWaterMl(2000);
    expect(consumer.current()).not.toBe(before);
    expect(before.water_ml).toBe(DEFAULT_WATER_ML); // the old snapshot is frozen in time
    expect(consumer.current().water_ml).toBe(2000);
    consumer.unmount();
  });

  it("stops notifying an unmounted consumer", () => {
    installStorage();
    const consumer = mountConsumer();
    consumer.unmount();
    toggleOwned(FIRST);
    expect(consumer.rendered).toHaveLength(1);
  });

  it("does not skip the remaining listeners when one unsubscribes mid-notify", () => {
    installStorage();
    const seen: string[] = [];
    const unsubFirst = subscribe(() => {
      seen.push("first");
      // What React does when a write unmounts the component that is rendering.
      unsubFirst();
    });
    const unsubSecond = subscribe(() => void seen.push("second"));
    const unsubThird = subscribe(() => void seen.push("third"));

    setWaterMl(1500);
    expect(seen).toEqual(["first", "second", "third"]);

    // ...and the listener that removed itself is really gone.
    setWaterMl(1200);
    expect(seen).toEqual(["first", "second", "third", "second", "third"]);
    unsubSecond();
    unsubThird();
  });

  it("does not notify a listener that subscribed during the notification", () => {
    // The tripwire for iterating the live Set: a listener added mid-pass would
    // be visited in that same pass, so a newcomer would see a write it was not
    // mounted for (and a listener that always subscribes would never finish).
    installStorage();
    const seen: string[] = [];
    let unsubLate: (() => void) | undefined;
    const unsubFirst = subscribe(() => {
      seen.push("first");
      unsubLate ??= subscribe(() => void seen.push("late"));
    });

    setWaterMl(1500);
    expect(seen).toEqual(["first"]);

    setWaterMl(1200);
    expect(seen).toEqual(["first", "first", "late"]);
    unsubFirst();
    unsubLate?.();
  });

  it("resyncs from another tab's write on the storage event", () => {
    const map = installStorage();
    const consumer = mountConsumer();

    // Another tab writes the key directly; this tab's snapshot is now stale.
    map.set(
      STORAGE_KEY,
      JSON.stringify({ ...defaultDeviceState(), drops_per_ml: 33 }),
    );
    expect(consumer.current().drops_per_ml).toBe(
      content.guards.default_drops_per_ml,
    );

    fireStorageEvent(STORAGE_KEY);

    expect(consumer.current().drops_per_ml).toBe(33);
    consumer.unmount();
  });

  it("ignores a storage event for an unrelated key", () => {
    installStorage();
    const consumer = mountConsumer();
    fireStorageEvent("some-other-app-key");
    expect(consumer.rendered).toHaveLength(1);
    consumer.unmount();
  });

  it("treats a clear() (key === null) as a change", () => {
    const map = installStorage();
    const consumer = mountConsumer();
    setWaterMl(2000);
    map.clear();
    fireStorageEvent(null);
    expect(consumer.current().water_ml).toBe(DEFAULT_WATER_ML);
    consumer.unmount();
  });
});

describe("actions sanitise on write, not only on read", () => {
  it("rejects a drops_per_ml of 0 before it reaches storage or the screen", () => {
    const map = installStorage();
    setCalibration(0);
    expect(getSnapshot().drops_per_ml).toBe(content.guards.default_drops_per_ml);
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}").drops_per_ml).toBe(
      content.guards.default_drops_per_ml,
    );
  });

  it("rejects an owned id that is not in the content", () => {
    const map = installStorage();
    updateDeviceState({ owned_concentrate_ids: ["gone-from-content"] });
    expect(getSnapshot().owned_concentrate_ids).toEqual([]);
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}").owned_concentrate_ids).toEqual(
      [],
    );
  });

  it("drops a future prep date on write", () => {
    const map = installStorage();
    setPreparedOn(FIRST, "2099-01-01");
    expect(getSnapshot().prepared_on).toEqual({});
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}").prepared_on).toEqual({});
  });

  it("keeps a valid past prep date and does not disturb its neighbours", () => {
    installStorage();
    // `setPreparedOn` re-dates something already on the shelf; `markPrepared`
    // is what puts it there. Own both first, or the gate drops both dates.
    toggleOwned(FIRST);
    toggleOwned(SECOND);
    setPreparedOn(FIRST, "2026-01-02");
    setPreparedOn(SECOND, "2026-01-03");
    expect(getSnapshot().prepared_on).toEqual({
      [FIRST]: "2026-01-02",
      [SECOND]: "2026-01-03",
    });
  });

  it("does not date a concentrate that is not owned", () => {
    const map = installStorage();
    setPreparedOn(FIRST, "2026-01-02");
    expect(getSnapshot().prepared_on).toEqual({});
    expect(getSnapshot().owned_concentrate_ids).toEqual([]);
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}").prepared_on).toEqual({});
  });

  it("rejects a non-positive water volume on write", () => {
    installStorage();
    setWaterMl(0);
    expect(getSnapshot().water_ml).toBe(DEFAULT_WATER_ML);
  });
});

describe("toggleOwned", () => {
  it("adds, then removes, returning to where it started", () => {
    installStorage();
    toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([FIRST]);
    toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([]);
  });

  it("never duplicates an id, however many times it is toggled", () => {
    installStorage();
    for (let i = 0; i < 5; i += 1) toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([FIRST]);
  });

  it("is a no-op for an id the content does not have", () => {
    installStorage();
    toggleOwned(FIRST);
    toggleOwned("gone-from-content");
    expect(getSnapshot().owned_concentrate_ids).toEqual([FIRST]);
  });

  it("leaves the other owned ids alone", () => {
    installStorage();
    toggleOwned(FIRST);
    toggleOwned(SECOND);
    toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([SECOND]);
  });
});

describe("markPrepared / the ownership-prep-date pairing", () => {
  it("owns the concentrate and dates it in ONE write", () => {
    installStorage();
    const consumer = mountConsumer();

    markPrepared(FIRST, "2026-01-02");

    expect(getSnapshot()).toMatchObject({
      owned_concentrate_ids: [FIRST],
      prepared_on: { [FIRST]: "2026-01-02" },
    });
    // One commit: consumers re-render once, never on a half-applied state.
    expect(consumer.rendered).toHaveLength(2);
    consumer.unmount();
  });

  it("persists both fields together", () => {
    const map = installStorage();
    markPrepared(FIRST, "2026-01-02");
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}")).toMatchObject({
      owned_concentrate_ids: [FIRST],
      prepared_on: { [FIRST]: "2026-01-02" },
    });
  });

  it("defaults the date to today, on the local calendar", () => {
    installStorage();
    markPrepared(FIRST);
    // Sanitisation drops anything that is not a real, not-future YYYY-MM-DD, so
    // a surviving date proves the default is well-formed and not tomorrow.
    const now = new Date();
    expect(getSnapshot().prepared_on[FIRST]).toBe(
      [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-"),
    );
  });

  it("re-dates rather than un-owning when the gesture repeats", () => {
    installStorage();
    markPrepared(FIRST, "2026-01-02");
    markPrepared(FIRST, "2026-01-03");
    expect(getSnapshot().owned_concentrate_ids).toEqual([FIRST]);
    expect(getSnapshot().prepared_on[FIRST]).toBe("2026-01-03");
  });

  it("leaves the other concentrates alone", () => {
    installStorage();
    toggleOwned(SECOND);
    markPrepared(FIRST, "2026-01-02");
    expect(getSnapshot().owned_concentrate_ids).toEqual([SECOND, FIRST]);
    expect(getSnapshot().prepared_on).toEqual({ [FIRST]: "2026-01-02" });
  });

  /**
   * The pairing invariant, asserted on the two fields themselves rather than
   * through "storage is sanitise-stable" — which a split pair PASSES, because an
   * owned concentrate with no prep date is itself a sanitised state. That is how
   * this survived: sanitisation validates the two fields independently, so a
   * known id with an unusable date kept the ownership half and silently dropped
   * the date half, leaving the shelf-life warning (RMP-256) with nothing to
   * count from.
   */
  function todayInTest(): string {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const UNUSABLE_DATES: Array<[string, string]> = [
    ["a future date", "2099-01-01"],
    ["a malformed date", "not-a-date"],
    ["a date V8 rolls over", "2026-02-31"],
    ["an empty string", ""],
  ];

  for (const [label, bad] of UNUSABLE_DATES) {
    it(`owns AND dates the concentrate given ${label}`, () => {
      installStorage();
      markPrepared(FIRST, bad);
      const state = getSnapshot();
      expect(state.owned_concentrate_ids).toContain(FIRST);
      expect(state.prepared_on[FIRST]).toBe(todayInTest());
    });
  }

  it("owns AND dates the concentrate with the default date", () => {
    installStorage();
    markPrepared(FIRST);
    expect(getSnapshot()).toMatchObject({
      owned_concentrate_ids: [FIRST],
      prepared_on: { [FIRST]: todayInTest() },
    });
  });

  it("keeps a usable past date as given, instead of overwriting it with today", () => {
    installStorage();
    markPrepared(FIRST, "2026-01-02");
    expect(getSnapshot().prepared_on[FIRST]).toBe("2026-01-02");
    expect(getSnapshot().prepared_on[FIRST]).not.toBe(todayInTest());
  });

  it("never lets ownership and prep date diverge, whatever it is handed", () => {
    // Both directions of the iff, through both gestures that can produce a dated
    // concentrate. `markPrepared` can only ever yield (owned, dated) or
    // (neither) — safeDate covers the bad-date half, the gate covers the
    // unknown-id half. `setPreparedOn` is the mirror case the gate closes: an
    // unowned id must come out dated-by-nothing, not dated-but-unowned.
    type Drive = [string, string, () => unknown];
    const drives: Drive[] = [
      ...UNUSABLE_DATES.map(([label, bad]): Drive => [
        FIRST,
        `markPrepared(known, ${label})`,
        () => markPrepared(FIRST, bad),
      ]),
      [FIRST, "markPrepared(known, past date)", () => markPrepared(FIRST, "2026-01-02")],
      [FIRST, "markPrepared(known, default date)", () => markPrepared(FIRST)],
      [
        "gone-from-content",
        "markPrepared(unknown, future date)",
        () => markPrepared("gone-from-content", "2099-01-01"),
      ],
      [
        "gone-from-content",
        "markPrepared(unknown, past date)",
        () => markPrepared("gone-from-content", "2026-01-02"),
      ],
      // The dated-but-unowned door: a valid date for a concentrate nobody owns.
      [
        FIRST,
        "setPreparedOn(known but unowned, past date)",
        () => setPreparedOn(FIRST, "2026-01-02"),
      ],
      [
        "gone-from-content",
        "setPreparedOn(unknown, past date)",
        () => setPreparedOn("gone-from-content", "2026-01-02"),
      ],
      [
        FIRST,
        "setPreparedOn(owned, past date)",
        () => void (toggleOwned(FIRST), setPreparedOn(FIRST, "2026-01-02")),
      ],
    ];

    for (const [id, label, drive] of drives) {
      installStorage();
      resetSnapshotForTests();
      drive();
      const state = getSnapshot();
      expect(state.owned_concentrate_ids.includes(id), label).toBe(
        id in state.prepared_on,
      );
    }
  });
});

describe("writes merge against the device, not a stale snapshot", () => {
  it("does not clobber a field another tab changed since this tab last read", () => {
    const map = installStorage();
    const consumer = mountConsumer(); // snapshot captured at the defaults

    // Another tab calibrates the dropper. No storage event is delivered (the
    // browser can drop it, or the consumer may not be listening yet), so this
    // tab's in-memory snapshot is stale.
    map.set(
      STORAGE_KEY,
      JSON.stringify({ ...defaultDeviceState(), drops_per_ml: 33 }),
    );

    toggleOwned(FIRST);

    expect(getSnapshot()).toMatchObject({
      drops_per_ml: 33,
      owned_concentrate_ids: [FIRST],
    });
    consumer.unmount();
  });

  it("applies two writes in the same tick, not just the last one", () => {
    installStorage();
    toggleOwned(FIRST);
    setCalibration(25);
    completeOnboarding();
    expect(getSnapshot()).toMatchObject({
      owned_concentrate_ids: [FIRST],
      drops_per_ml: 25,
      onboarding_done: true,
    });
  });

  it("keeps the in-memory state usable when storage is unavailable", () => {
    installThrowingStorage();
    toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([FIRST]);
    toggleOwned(FIRST);
    expect(getSnapshot().owned_concentrate_ids).toEqual([]);
  });
});
