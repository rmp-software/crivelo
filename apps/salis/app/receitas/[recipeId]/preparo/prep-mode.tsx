"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@crivelo/ui/button";
import { cn } from "@crivelo/ui/lib/utils";
import { computeRecipe, type DoseRow } from "@/engine/dosing";
import type { BaseWater, Recipe } from "@/engine/types";
import { content } from "../../../content";
import { useDeviceStore } from "../../../device-store";
import { TopBar } from "../../../top-bar";
import { clampWaterMl, dropsUnit, formatMl, formatWhole } from "../format";

/**
 * Juliana's starting water, until RMP-261 turns it into a chip.
 *
 * DUPLICATED verbatim from S2 (`../recipe-counter.tsx`), pending extraction to
 * a shared module. Both screens must dose against the same base water; the
 * extraction has to touch S2, which another open PR owns.
 */
const BASE_WATER: BaseWater =
  content.base_waters.find((water) => water.id === "destilada") ??
  content.base_waters[0];

/**
 * The dose rows carry a mineral id; the tile wants the salt's full name.
 * Also duplicated from S2, pending the same extraction.
 */
const MINERAL_NAME_BY_ID = new Map(
  content.minerals.map((mineral) => [mineral.id, mineral.name_pt]),
);

/**
 * S3 · Modo preparo — the counter mode.
 *
 * One job: get the student through the jug without looking away. Each row of
 * S2 becomes a tile big enough to hit with a wet thumb, it ticks when it is
 * dosed, and the screen stays awake while that happens.
 *
 * **The numbers are recomputed, not carried.** This screen calls `computeRecipe`
 * itself with the water volume the device store holds — the same input S2 used.
 * Passing the rows through the URL or a context would mean a deep link or a
 * reload mid-prep showed stale drop counts, or none; reading the store means
 * every entry point agrees by construction. The engine is the only place the
 * arithmetic lives (see `engine/dosing.ts`), here as on S2.
 *
 * **Mixing order IS tile order.** `result.rows` comes out of the engine in
 * `recipe.concentrate_ids` order — Juliana's mixing order, as her sheet types
 * it. There is no sort here and no salt list typed into this file: reorder the
 * data and the tiles reorder. The one part of that order this screen depends on
 * — the bicarbonate going in last — is enforced where content enters the
 * system: `scripts/import-content.ts` REJECTS a recipe whose HCO₃ concentrate
 * is not last in `concentrate_ids`, so a reordered spreadsheet fails the import
 * instead of shipping a wrong order. `mixing-order.test.ts` checks the same
 * property on the committed content as a second line of defence.
 *
 * **A concentrate the student does not own is DIMMED, never dropped.** Same
 * rule and same visual language as S2 — see `DoseTile`.
 *
 * **Ticks are ephemeral.** ponytail: per-session `useState`, never the device
 * store. A half-ticked prep has no meaning after the app closes — the jug is
 * either made or it is not — so persisting it would buy nothing and cost a
 * migration surface in the one module that must never hold junk.
 */
export function PrepMode({ recipe }: { recipe: Recipe }) {
  const { state, loaded } = useDeviceStore();
  useScreenWakeLock();

  const waterMl = clampWaterMl(state.water_ml);
  const result = computeRecipe({
    recipe,
    baseWater: BASE_WATER,
    concentrates: content.concentrates,
    minerals: content.minerals,
    guards: content.guards,
    drops_per_ml: state.drops_per_ml,
    volume_l: waterMl / 1000,
  });

  // `loaded` is false on the hydration render, where the store still holds the
  // server defaults — an empty shelf. Ownership is therefore UNKNOWN, not
  // false: `null` until the device has been read, exactly as S2 does it
  // (`../recipe-counter.tsx` § RecipeCounter). Defaulting to "missing" would
  // dim every tile for one frame on every cold launch.
  const owned = new Set(state.owned_concentrate_ids);
  const haveConcentrate = (concentrateId: string) =>
    loaded ? owned.has(concentrateId) : null;

  const [ticked, setTicked] = useState<readonly string[]>([]);
  const toggle = (concentrateId: string) =>
    setTicked((prev) =>
      prev.includes(concentrateId)
        ? prev.filter((id) => id !== concentrateId)
        : [...prev, concentrateId],
    );

  const allDosed =
    result.rows.length > 0 && ticked.length === result.rows.length;

  return (
    <>
      <TopBar
        title={recipe.name_pt}
        subtitle={`Para ${formatWhole(waterMl)} mL`}
        // The wireframe draws this control as ✕; it is a chevron here because
        // `TopBar` owns the back control's shape and every pushed screen in the
        // app uses the same one. It goes back to S2 rather than to the list:
        // leaving modo preparo lands on the recipe it was entered from.
        backHref={`/receitas/${recipe.id}`}
      />
      <div className="flex flex-col gap-4 px-gutter pt-1 pb-8">
        <p className="text-body-sm text-fg-2">
          Toque em cada concentrado depois de dosar.
        </p>

        <ol className="flex flex-col gap-3">
          {result.rows.map((row) => (
            <li key={row.concentrate_id}>
              <DoseTile
                row={row}
                have={haveConcentrate(row.concentrate_id)}
                done={ticked.includes(row.concentrate_id)}
                onToggle={() => toggle(row.concentrate_id)}
              />
            </li>
          ))}
        </ol>

        {/* The last step, and the one the screen ends on. It is always on
            screen — a student mid-count must not have to scroll to learn the
            jug still needs shaking — and it fills in once every tile is ticked,
            which is the only moment it is an instruction rather than a preview. */}
        <p
          aria-live="polite"
          className={cn(
            "flex min-h-tap-min items-center rounded-lg px-4 py-3 text-body",
            allDosed
              ? "bg-success-soft font-semibold text-success-ink"
              : "bg-surface-sunken text-fg-2",
          )}
        >
          Agite 10 s. Pronto para usar.
        </p>

        <Button asChild size="lg" className="h-tap-min w-full text-body">
          <Link href={`/receitas/${recipe.id}`}>Concluir</Link>
        </Button>
      </div>
    </>
  );
}

/**
 * One concentrate, as a tile to hit and tick.
 *
 * A real `<button>` — focusable, keyboard-operable (Enter and Space come free),
 * and announced with its pressed state — rather than a div with a click
 * handler. `aria-pressed` carries "dosed"; the check mark is decorative, since
 * a tick drawn in a corner is not a label.
 *
 * `min-h-24` (96 px) over the 44 px floor: this is the whole point of modo
 * preparo, and the tile is aimed at with the hand that is holding the dropper.
 * The floor still appears as `min-h-tap-min` on the band inside it.
 *
 * Which unit leads is the ENGINE's call (`row.display`), exactly as on S2 —
 * under 3 drops and over 60 the millilitres lead. Re-deriving it here is how
 * the two screens would start disagreeing about the same jug.
 *
 * **A concentrate the student does not own is DIMMED — never hidden, never
 * disabled.** Same treatment as S2's `DoseRowCard`: the identity goes to
 * `text-fg-3` and the border becomes the dashed warning rule, drawn as an inset
 * `outline` so flipping it on hydration costs no layout. The drop count stays
 * at full ink and the tile stays tappable, because "never block a brew" means
 * a student who is one bottle short still works through the ones they have and
 * still sees what the missing one would have taken.
 */
function DoseTile({
  row,
  have,
  done,
  onToggle,
}: {
  row: DoseRow;
  /** `null` before the device state loads: neither owned nor missing. */
  have: boolean | null;
  done: boolean;
  onToggle: () => void;
}) {
  // Only a KNOWN absence dims the tile. Unknown reads as the plain tile, which
  // claims nothing either way. A ticked tile has been dosed, so its success
  // state wins: there is nothing left to warn about.
  const missing = have === false && !done;
  const leadsWithMl = row.display === "ml";
  // Bicarbonate goes in last, and the tile says so where the student is
  // looking. Read off the row's ION, not off a list of concentrate ids typed
  // into this file: the day Juliana adds a second bicarbonate stock, or renames
  // one, this keeps telling the truth. The ORDER is the data's (see PrepMode);
  // this is only the label that names it.
  const last = row.ion === "HCO3";

  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      className={cn(
        "flex w-full min-h-24 cursor-pointer items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-colors",
        // No `outline-none` anywhere near this: in Tailwind v4 it sets
        // `--tw-outline-style: none`, which `outline-2` then reads — and the
        // ring silently stops painting. See `top-bar.tsx` for the same trap.
        "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "active:scale-[.99]",
        done
          ? "border-success bg-success-soft"
          : missing
            ? // S2's exact rule: a transparent 1 px border keeps the box the
              // same height, and the 1,5 px dashed warning rule is an inset
              // outline, which takes no space to flip on hydration.
              "border-transparent bg-surface outline-[1.5px] outline-dashed outline-warning -outline-offset-[1.5px]"
            : "border-border bg-surface shadow-xs",
      )}
    >
      <Check done={done} />

      <span className="flex min-w-0 flex-1 flex-col">
        {/* label_pt verbatim, as on S2 and S4: it is what the student wrote on
            the bottle, so it has to match the sticker they are reading. */}
        <span
          className={cn(
            "truncate font-mono text-data-md font-medium",
            done ? "text-success-ink" : missing ? "text-fg-3" : "text-fg",
          )}
        >
          {row.label_pt}
        </span>
        <span
          className={cn(
            "truncate text-body-sm",
            done ? "text-success-ink" : "text-fg-3",
          )}
        >
          {MINERAL_NAME_BY_ID.get(row.mineral_id)}
        </span>
        {last && (
          <span
            className={cn(
              "truncate text-body-sm font-semibold",
              done ? "text-success-ink" : "text-fg-2",
            )}
          >
            por último
          </span>
        )}
      </span>

      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-data-lg font-medium",
              done ? "text-success-ink" : "text-fg",
            )}
          >
            {leadsWithMl ? formatMl(row.ml) : formatWhole(row.drops)}
          </span>
          <span
            className={cn(
              "font-mono text-data-xs",
              done ? "text-success-ink" : "text-fg-3",
            )}
          >
            {leadsWithMl ? "mL" : dropsUnit(row.drops)}
          </span>
        </span>
        <span
          className={cn(
            "font-mono text-data-xs",
            done ? "text-success-ink" : "text-fg-3",
          )}
        >
          {leadsWithMl
            ? `${formatWhole(row.drops)} ${dropsUnit(row.drops)}`
            : `${formatMl(row.ml)} mL`}
        </span>
      </span>
    </button>
  );
}

/**
 * The tile's tick: an empty ring before, a filled check after.
 *
 * Decorative. `aria-pressed` on the tile is what carries the state to a screen
 * reader, and colour is never the only signal — the mark itself appears.
 */
function Check({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border-[1.5px]",
        done
          ? "border-success bg-success text-fg-inverse"
          : "border-border-strong bg-surface text-transparent",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

/**
 * Keep the screen on while modo preparo is open, if the platform lets us.
 *
 * `navigator.wakeLock` is the native API — no dependency, nothing to ship. It
 * is also absent or refused in more situations than it is granted: an
 * unsupported browser (every iOS Safari before 16.4), a request without a user
 * gesture, a hidden tab, a device in battery-saver mode, an insecure origin.
 * Every one of those paths is a no-op here: a student with a screen that dims
 * can still read, tap and finish the jug, so there is nothing to tell them and
 * nothing worth an error state on the screen they are using mid-dose.
 *
 * The platform releases the lock itself when the tab hides, and does NOT give
 * it back on return — hence the `visibilitychange` listener, which re-requests
 * once the document is visible again. Requesting while hidden rejects, so the
 * listener checks before asking.
 *
 * Two flags guard the same await, for two different leaks. `cancelled` covers
 * the effect being torn down while `request()` is in flight: a student who taps
 * Concluir during that await would otherwise leave a lock held by an unmounted
 * screen. `pending` covers a second `acquire()` starting while the first is in
 * flight — see the comment on the guard.
 */
function useScreenWakeLock(): void {
  useEffect(() => {
    // Typed non-optional in lib.dom, absent at runtime in plenty of browsers.
    const api: WakeLock | undefined = navigator.wakeLock;
    if (!api) return;

    let sentinel: WakeLockSentinel | null = null;
    let pending = false;
    let cancelled = false;

    const acquire = async () => {
      // `sentinel` says a lock is HELD; `pending` says one is on its way. Both
      // are needed: `request()` is async, so a `visibilitychange` landing
      // mid-await would otherwise pass a sentinel-only guard and issue a second
      // request. Whichever resolved last would win the variable and the other
      // sentinel would be orphaned — no handle, no `release()`, held until the
      // platform took it back.
      if (
        cancelled ||
        pending ||
        sentinel ||
        document.visibilityState !== "visible"
      ) {
        return;
      }
      pending = true;
      try {
        const next = await api.request("screen");
        if (cancelled) {
          void next.release().catch(() => {});
          return;
        }
        sentinel = next;
        // Drop our handle when the platform drops the lock (tab hidden, battery
        // saver), so the next `acquire` is free to take a fresh one.
        next.addEventListener("release", () => {
          if (sentinel === next) sentinel = null;
        });
      } catch {
        // No gesture yet, hidden tab, battery saver, policy. Prep works without
        // it; there is deliberately no user-facing failure here.
      } finally {
        pending = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    void acquire();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, []);
}
