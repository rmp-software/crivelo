"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@crivelo/ui/button";
import { Toggle } from "@crivelo/ui/toggle";
import { cn } from "@crivelo/ui/lib/utils";
import type { Concentrate } from "@/engine/types";
import { content } from "../content";
import { updateDeviceState, useDeviceStore } from "../device-store";
import { findUnlockingConcentrate } from "./unlocking-concentrate";

/**
 * S0 · Primeira abertura — three screens, skippable, about 90 seconds.
 *
 * The thesis, "quais concentrados você já tem?" as a tap grid, and the dropper
 * calibration (see the wireframes in `docs/01-v1-plan.md` § Screens). It exists
 * because of the plan's first principle: a student cannot make any water until
 * a bottle exists, so the app learns what they have before it sells them the
 * recipe list — and because the dropper is NOT standardised (real Brazilian
 * droppers run 10–40 gotas/mL, `docs/content-assumptions.md` § 4), so 20 is a
 * default to confirm, never a constant to assume.
 *
 * **One route, three steps, one commit.** The steps are local state rather than
 * three routes: `AppShell` keys its scroll container on the pathname, so a route
 * per step would remount the subtree and the selections would have to live above
 * the shell (see the note in `app-shell.tsx`). One route also means one write —
 * inventory, calibration and completion land together through
 * {@link updateDeviceState}, the store's documented composite for exactly this
 * step, instead of three writes a user could abandon halfway through.
 *
 * **No tab bar, by virtue of the route.** `/onboarding` is not one of the three
 * tab paths, so `isRootTabPath` hides the bar with no flag to pass (`app/tabs.ts`).
 * There is no `TopBar` either: onboarding is not a screen inside the app's
 * chrome, it is what runs before it.
 *
 * DELIBERATE SCOPE: the plan calls these "swipes" and they advance by button,
 * the control its own wireframe draws ([Começar] / [Continuar] / [Pronto]). A
 * real swipe carousel (CSS scroll-snap would do it) would put all three panels
 * in the accessibility tree at once and needs scroll-position plumbing for the
 * dots and the buttons — for a 90-second flow that is run once, the buttons are
 * the whole of the interaction the design asks for.
 */

/**
 * The calibration range, from `docs/content-assumptions.md` § 4: measured
 * Brazilian droppers span roughly 10–40 gotas/mL. Outside that band the number
 * is a typo, not a dropper, and it divides every drop count in the app.
 */
const MIN_DROPS_PER_ML = 10;
const MAX_DROPS_PER_ML = 40;

const STEP_COUNT = 3;

/**
 * Same focus treatment as `TopBar`'s headings, and for the same reason: the
 * heading is focused programmatically on every step change, so the UA ring must
 * not fire at the mouse user who caused it while the keyboard user keeps a
 * visible one. See the comment on `titleFocus` in `app/top-bar.tsx` for why
 * `outline-solid` is load-bearing next to `outline-none`.
 */
const titleFocus =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export default function OnboardingPage() {
  const router = useRouter();
  const { state } = useDeviceStore();
  const [step, setStep] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  /**
   * The stepper shows what the student has picked this session, and the device's
   * calibration until they do — so a student who reopens onboarding edits their
   * own value rather than a fresh 20, with no effect to sync the two. Before
   * hydration `state.drops_per_ml` IS `guards.default_drops_per_ml` (the store's
   * server snapshot), so this is stable across the hydration boundary.
   */
  const dropsPerMl = picked ?? state.drops_per_ml;

  /**
   * Move focus to the new step's heading. `AppShell` does this for route changes
   * only, and the steps share a route — without it the advance button unmounts
   * under the user's focus, which drops focus to `<body>` and announces nothing.
   */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  /**
   * Make Back walk the steps instead of leaving onboarding.
   *
   * Three steps in one route means the browser sees ONE history entry, so Back
   * from step 2 or 3 left `/onboarding` entirely — and since `/` arrives here
   * through `replace`, coming back remounted this component at step 0 with an
   * empty grid, silently discarding every tile the student had tapped. Back is a
   * reflex on a phone and the grid is six taps' worth of answers.
   *
   * So each advance pushes a history entry carrying the step it leads to, and
   * this listener reads the step back off whatever entry the traversal landed
   * on. Entries are `[/onboarding, {salisStep:1}, {salisStep:2}]`: Back from
   * step 2 lands on `{salisStep:1}` → step 1, Back again lands on the original
   * entry, which has no marker → step 0. Reading the marker rather than just
   * decrementing is what also makes Forward land on the step it left.
   *
   * Back from step 0 still leaves onboarding — there is no entry of ours below
   * it — which is correct: that is the way out.
   *
   * Only `step` moves. `owned` and `picked` are untouched, so the selections
   * survive the traversal; nothing remounts because every pushed entry is the
   * same URL (Next's patched `pushState` copies its own router internals onto
   * our state object, so its `popstate` handler restores the same route tree).
   */
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      setStep(event.state?.salisStep ?? 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /** Advance one step, leaving a history entry behind for Back to return to. */
  function advance() {
    const next = step + 1;
    // No URL argument: the entry is the same address, only a marker deeper.
    window.history.pushState({ salisStep: next }, "");
    setStep(next);
  }

  const unlocking = findUnlockingConcentrate(
    content.concentrates,
    content.recipes,
  );
  /**
   * The empty-grid branch from the plan: with nothing on the shelf the last
   * screen stops asking about the dropper — there is nothing to dose yet — and
   * points at the one bottle that unlocks the most recipes instead. Calibration
   * stays at its default and is still written; the student confirms it when they
   * have something to drip.
   */
  const showPrepStep = owned.length === 0 && unlocking !== null;

  /**
   * The one write: inventory + calibration + completion, as a single commit.
   * Returns whether it reached the device.
   */
  function commit(): boolean {
    return updateDeviceState({
      owned_concentrate_ids: owned,
      drops_per_ml: dropsPerMl,
      onboarding_done: true,
    });
  }

  /**
   * Finish (or skip). A first failed write reports instead of navigating, so the
   * student is told their choices did not survive the device rather than finding
   * out on the next launch; a second tap goes through anyway.
   *
   * What that second tap buys is exactly one session, and no more. `commit()`
   * updates the in-memory snapshot even when `persist()` fails, so the rest of
   * this launch behaves as if onboarding were done — but nothing reached the
   * device. On a device that denies storage permanently (a private window kept
   * open, storage blocked for the origin), the next launch re-reads the
   * defaults, finds `onboarding_done: false`, and runs onboarding again. Every
   * time.
   *
   * That is `device-store.ts`'s documented degraded mode reaching the screen,
   * not a gap to patch here: without somewhere to write, there is nowhere to
   * record that this student has been through this flow. The session proceeds;
   * the device does not remember.
   */
  function finish() {
    if (commit() || saveFailed) {
      router.replace("/receitas");
      return;
    }
    setSaveFailed(true);
  }

  function toggleOwn(id: string) {
    setOwned((prev) =>
      prev.includes(id) ? prev.filter((owned) => owned !== id) : [...prev, id],
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Matches the 56 px top bar every other screen has, so the content below
          starts at the same height throughout the app. */}
      <div className="flex h-topbar shrink-0 items-center justify-end px-2">
        <Button
          variant="ghost"
          onClick={finish}
          className="h-tap-min px-3 text-body text-fg-2"
        >
          Pular
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 px-gutter pb-6">
        {step === 0 && <Thesis headingRef={headingRef} step={step} />}
        {step === 1 && (
          <Inventory
            headingRef={headingRef}
            step={step}
            owned={owned}
            onToggle={toggleOwn}
          />
        )}
        {step === 2 &&
          (showPrepStep ? (
            <PrepFirst
              headingRef={headingRef}
              step={step}
              concentrate={unlocking.concentrate}
              recipeCount={unlocking.recipeCount}
            />
          ) : (
            <Calibration
              headingRef={headingRef}
              step={step}
              dropsPerMl={dropsPerMl}
              onChange={setPicked}
            />
          ))}

        <div className="mt-auto flex flex-col gap-4 pt-6">
          {saveFailed && (
            <p role="alert" className="text-body-sm text-danger-ink">
              Não foi possível salvar neste dispositivo. Toque de novo para
              continuar sem salvar.
            </p>
          )}
          <Dots step={step} />
          {step < 2 ? (
            <Button
              onClick={advance}
              className="h-13 w-full text-body"
            >
              {step === 0 ? "Começar" : "Continuar"}
            </Button>
          ) : showPrepStep ? (
            <Button asChild className="h-13 w-full text-body">
              <Link
                href={`/concentrados/${unlocking.concentrate.id}`}
                /* The commit has to land before the navigation, and a failed one
                   has to be reportable — so the anchor stays an anchor (openable,
                   shareable) and cancels its own default on the first failure. */
                onClick={(event) => {
                  if (!commit() && !saveFailed) {
                    event.preventDefault();
                    setSaveFailed(true);
                  }
                }}
              >
                Preparar concentrado
              </Link>
            </Button>
          ) : (
            <Button onClick={finish} className="h-13 w-full text-body">
              Pronto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shared heading for every step: focusable, so the step change is announced. */
function StepHeading({
  headingRef,
  step,
  children,
  className,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  step: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={cn("font-semibold text-fg", titleFocus, className)}
      >
        {children}
      </h1>
      <p className="sr-only">{`Passo ${step + 1} de ${STEP_COUNT}.`}</p>
    </div>
  );
}

/**
 * Step 1 — the thesis. No period on the title (the voice rule in
 * apps/salis/CLAUDE.md: titles and buttons carry none), which is the one place
 * this screen departs from the plan's ASCII sketch.
 */
function Thesis({
  headingRef,
  step,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  step: number;
}) {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <StepHeading headingRef={headingRef} step={step} className="text-display">
        A água é o primeiro ingrediente
      </StepHeading>
      <p className="text-body text-fg-2">
        Salis calcula as gotas; a Juliana ensina o porquê.
      </p>
    </div>
  );
}

/**
 * Step 2 — the inventory grid.
 *
 * Independent `Toggle`s in a two-column grid rather than a `ToggleGroup`: the
 * group primitive is built for a segmented row (items stretch, inner corners and
 * borders are stripped, focus roves across the set with the arrow keys), all of
 * which has to be undone for a grid of separate yes/no answers. Each tile being
 * its own tab stop is also the better keyboard story here.
 *
 * The plan's wireframe also offers a "Nenhum ainda →" shortcut. It is left out
 * because it is the same action as continuing with nothing selected, and two
 * controls for one outcome is one too many to explain.
 */
function Inventory({
  headingRef,
  step,
  owned,
  onToggle,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  step: number;
  owned: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <StepHeading headingRef={headingRef} step={step} className="text-h1">
        Quais concentrados você já tem?
      </StepHeading>
      <p className="text-body-sm text-fg-2">
        Marque os que você já preparou. Você pode ajustar depois em
        Concentrados.
      </p>
      <div
        role="group"
        aria-label="Concentrados que você já tem"
        className="grid grid-cols-2 gap-2.5"
      >
        {content.concentrates.map((concentrate) => {
          const mineral = content.minerals.find(
            (candidate) => candidate.id === concentrate.mineral_id,
          );
          const selected = owned.includes(concentrate.id);
          return (
            <Toggle
              key={concentrate.id}
              variant="outline"
              pressed={selected}
              onPressedChange={() => onToggle(concentrate.id)}
              className={cn(
                "h-auto min-h-tap-min items-start justify-start gap-2.5 rounded-lg border-border bg-surface p-3 text-left whitespace-normal",
                "hover:bg-surface-sunken hover:text-fg",
                "data-[state=on]:border-mineral data-[state=on]:bg-mineral-soft data-[state=on]:text-fg",
              )}
            >
              {/* The handoff's checkbox: 22 px box, 1.5 px border, radius 4.
                  Selection is not carried by colour alone — the check is the
                  non-colour cue, and `aria-pressed` carries it to a reader. */}
              <span
                aria-hidden="true"
                className={cn(
                  "mt-px grid size-5.5 shrink-0 place-items-center rounded-xs border-[1.5px]",
                  selected
                    ? "border-mineral bg-mineral text-fg-inverse"
                    : "border-border-strong bg-surface",
                )}
              >
                {selected && <CheckGlyph />}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-data-sm font-medium">
                  {concentrate.label_pt}
                </span>
                {mineral && (
                  <span className="text-caption font-normal text-fg-3">
                    {mineral.name_pt}
                  </span>
                )}
              </span>
            </Toggle>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Step 3 — the dropper. 20 is a starting point to check, not a fact: see the
 * module header and `docs/content-assumptions.md` § 4.
 *
 * The number is announced ONCE per change, by the single polite live region
 * below. The visible figure is `aria-hidden` so the same change is not read
 * twice, and the live region sits before the buttons in reading order so a
 * reader meets the current value on the way to them.
 */
function Calibration({
  headingRef,
  step,
  dropsPerMl,
  onChange,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  step: number;
  dropsPerMl: number;
  onChange: (value: number) => void;
}) {
  const clamp = (value: number) =>
    Math.min(MAX_DROPS_PER_ML, Math.max(MIN_DROPS_PER_ML, value));
  return (
    <div className="flex flex-col gap-4 pt-2">
      <StepHeading headingRef={headingRef} step={step} className="text-h1">
        Seu conta-gotas
      </StepHeading>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <span
          aria-hidden="true"
          className="text-overline font-mono uppercase text-fg-3"
        >
          Gotas em 1 mL
        </span>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            aria-label="Menos uma gota"
            disabled={dropsPerMl <= MIN_DROPS_PER_ML}
            onClick={() => onChange(clamp(dropsPerMl - 1))}
            className="size-12 border-border-strong p-0 text-h2 font-normal text-fg"
          >
            <MinusGlyph />
          </Button>
          <span
            aria-hidden="true"
            className="font-mono text-data-xl font-medium text-fg"
          >
            {dropsPerMl}
          </span>
          <Button
            variant="outline"
            aria-label="Mais uma gota"
            disabled={dropsPerMl >= MAX_DROPS_PER_ML}
            onClick={() => onChange(clamp(dropsPerMl + 1))}
            className="size-12 border-border-strong p-0 text-h2 font-normal text-fg"
          >
            <PlusGlyph />
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">
          {`${dropsPerMl} gotas enchem 1 mL.`}
        </p>
      </div>
      <p className="text-body-sm text-fg-2">
        Conte quantas gotas enchem 1 mL na seringa e ajuste. Leva 10 segundos.
      </p>
    </div>
  );
}

/**
 * Step 3, empty-grid variant — "Comece pelo {mineral}".
 *
 * The mineral in the heading is whatever the content says unlocks the most
 * recipes (see `./unlocking-concentrate`), not the "Mg" the plan's copy names.
 * The short form is the first word of her label (`"Mg 30.000"` → `"Mg"`), so the
 * heading stays the length the design drew.
 */
function PrepFirst({
  headingRef,
  step,
  concentrate,
  recipeCount,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  step: number;
  concentrate: Concentrate;
  recipeCount: number;
}) {
  const shortName = concentrate.label_pt.split(" ")[0];
  const total = content.recipes.length;
  return (
    <div className="flex flex-col gap-4 pt-2">
      <StepHeading headingRef={headingRef} step={step} className="text-h1">
        {`Comece pelo ${shortName}`}
      </StepHeading>
      <p className="text-body text-fg-2">
        {recipeCount >= total
          ? `O ${concentrate.label_pt} entra em todas as ${total} receitas da Juliana.`
          : `O ${concentrate.label_pt} entra em ${recipeCount} das ${total} receitas da Juliana.`}
      </p>
      <p className="text-body-sm text-fg-2">
        Prepare este frasco primeiro. O conta-gotas você calibra depois.
      </p>
    </div>
  );
}

/** The wireframe's ● ○ ○. Decorative — `StepHeading` carries the step in text. */
function Dots({ step }: { step: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-1.5"
    >
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-1.5 rounded-full",
            index === step ? "bg-brand" : "bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}

/**
 * Lucide `check`, inlined here rather than added to `app/icons.tsx` — that map
 * is documented as the glyph set the navigation *chrome* needs, and this is one
 * screen's own mark.
 */
/**
 * Lucide `minus` / `plus`, inlined for the same reason as CheckGlyph below:
 * `app/icons.tsx` is the navigation chrome's glyph set, and these belong to
 * one screen. They replace the raw "−" and "+" characters this stepper used
 * to render — the design system bans Unicode pictographs as icons, and the
 * handoff ships these exact glyphs (.design/project/assets/icons/).
 */
function StepperGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MinusGlyph() {
  return (
    <StepperGlyph>
      <path d="M5 12h14" />
    </StepperGlyph>
  );
}

function PlusGlyph() {
  return (
    <StepperGlyph>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </StepperGlyph>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
