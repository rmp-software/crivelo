"use client";

import Link from "next/link";
import { Button } from "@crivelo/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@crivelo/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@crivelo/ui/toggle-group";
import { cn } from "@crivelo/ui/lib/utils";
import { computeRecipe, type DoseRow } from "@/engine/dosing";
import type { BaseWater, IonKey, IonProfile, Recipe } from "@/engine/types";
import { formatBrDate } from "../../concentrados/[concentrateId]/prep-content";
import { shelfLife } from "../../concentrados/shelf-life";
import { content } from "../../content";
import { setWaterMl, useDeviceStore } from "../../device-store";
import { TopBar } from "../../top-bar";
import {
  WATER_MAX_ML,
  WATER_MIN_ML,
  WATER_PRESETS_ML,
  clampWaterMl,
  dropsUnit,
  formatMgPerL,
  formatMl,
  formatWhole,
  rowNoteKind,
  stepWaterMl,
} from "./format";
import { Quantities } from "./quantities";
import { recipeWarningTexts, rowWarningText } from "./warnings";

/**
 * Juliana's starting water, until RMP-261 turns it into a chip.
 *
 * The importer REQUIRES a `destilada` entry with every ion at zero and refuses
 * to write `content.json` without one (`scripts/import-content.ts`), so this
 * lookup cannot miss on a content file that exists at all — the fallback is
 * there to narrow the type, not to express a policy.
 */
const BASE_WATER: BaseWater =
  content.base_waters.find((water) => water.id === "destilada") ??
  content.base_waters[0];

/** Row identity needs the salt's full name; the dose rows carry only its id. */
const MINERAL_NAME_BY_ID = new Map(
  content.minerals.map((mineral) => [mineral.id, mineral.name_pt]),
);

/**
 * How long each bottle stays good, from Juliana's sheet. The dose rows carry
 * only a concentrate id, and the shelf-life question needs the bottle's own
 * window beside the device's prep date.
 */
const SHELF_LIFE_DAYS_BY_ID = new Map(
  content.concentrates.map((concentrate) => [
    concentrate.id,
    concentrate.shelf_life_days,
  ]),
);

/** The ion sheet's reading order (`docs/01-v1-plan.md` § Screens, S2). */
const ION_ORDER: IonKey[] = ["Ca", "Mg", "HCO3", "Na", "K", "Cl", "SO4", "citrate"];

/**
 * S2 · Receita — the counter screen, and the one the whole app exists for.
 *
 * A Client Component end to end, because every number on it is a function of
 * device state: the water volume the student last used, this device's dropper
 * calibration, and what is on their shelf. The Server Component above resolves
 * the recipe (and 404s) so there is no second lookup, and no unreachable
 * not-found branch, down here.
 *
 * **The arithmetic is NOT here.** `computeRecipe` is Phase 1 work with tests
 * behind it; it already owns base-water subtraction, the rounding rule, the
 * <3 / >60 drop display rule, the guards and the plane. This file decides
 * layout and Portuguese, nothing else. A number computed in a component is a
 * number that disagrees with the engine the day one of them changes.
 *
 * **The summary does not move with the stepper.** GH/KH is a concentration, so
 * the engine reads it off the recipe's targets, not off the rounded drop
 * counts. Doubling the water doubles every row and leaves "GH 94 · KH 49"
 * exactly where it was — if that line ever twitches when the volume changes,
 * that is a bug in the engine, not a rounding artefact to paper over here.
 */
export function RecipeCounter({ recipe }: { recipe: Recipe }) {
  const { state, loaded } = useDeviceStore();

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
  // false and not true: `null` until the device has been read, which is what
  // S5 does with the same question (`app/concentrados/inventory.tsx` § Row).
  // Defaulting to "present" kept the banners off the first frame but told a
  // student who owns nothing that they own all three — the vial solid, the
  // label at full ink. Neutral says nothing instead, and says it in the same
  // box: the card keeps its 1 px border, the dashed rule is an outline, and the
  // note band is reserved in every state, so nothing here moves on hydration.
  // The drop counts are NOT gated this way: they are the reason the screen
  // exists, and the default volume they are computed at is the one the course
  // teaches with.
  const owned = new Set(state.owned_concentrate_ids);
  const haveConcentrate = (concentrateId: string) =>
    loaded ? owned.has(concentrateId) : null;

  // Every warning the engine raised, in Juliana's Portuguese and split by the
  // scope the copy module declares (`./warnings.ts`): the recipe's own warnings
  // go in the list under the summary, and the row-scoped ones are handed to the
  // row they describe. A student doses row by row, so a flag about one bottle
  // three sections further down is a flag they will not read.
  const recipeWarnings = recipeWarningTexts(result.warnings);

  return (
    <>
      <TopBar
        title={recipe.name_pt}
        subtitle={`Para ${formatWhole(waterMl)} mL`}
        backHref="/receitas"
        // NO rightAction. The wireframe shows `⋯` there, but the only thing it
        // would hold is "Salvar como minha receita" (RMP-264), and a control
        // that goes nowhere is worse than no control — the same call S1 made.
      />
      <div className="flex flex-col gap-6 px-gutter pt-1 pb-8">
        <div className="flex flex-col gap-1">
          <p className="text-pretty text-body text-fg-2">{recipe.promise_pt}</p>
          {recipe.methods.length > 0 && (
            <p className="text-body-sm text-fg-3">
              {recipe.methods.join(", ")}.
            </p>
          )}
        </div>

        <WaterStepper waterMl={waterMl} />

        <section className="flex flex-col gap-2.5">
          <h2 className="text-h3 font-semibold text-fg">Concentrados</h2>
          <ul className="flex flex-col gap-2.5">
            {result.rows.map((row) => (
              <li key={row.concentrate_id}>
                <DoseRowCard
                  row={row}
                  have={haveConcentrate(row.concentrate_id)}
                  preparedOn={state.prepared_on[row.concentrate_id]}
                  warning={rowWarningText(result.warnings, row.concentrate_id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <Summary
          gh={result.gh_caco3}
          kh={result.kh_caco3}
          ions={result.ions}
          tds={result.tds_estimate}
        />

        {recipeWarnings.length > 0 && (
          <ul className="flex flex-col gap-2">
            {recipeWarnings.map((copy) => (
              <li
                key={copy}
                className="rounded-md bg-warning-soft px-4 py-2.5 text-body-sm text-warning-ink"
              >
                <Quantities text={copy} />
              </li>
            ))}
          </ul>
        )}

        <MixingOrder rows={result.rows} />

        {/* RMP-257 builds `/receitas/[recipeId]/preparo` (S3 · Modo preparo).
            Until it lands this button 404s — deliberately, so the route is
            already wired and the screen is the only thing missing.
            "Salvar como minha receita" is RMP-264 and is not rendered: the S6
            builder and the store field it would write do not exist yet. */}
        <Button asChild size="lg" className="h-tap-min w-full text-body">
          <Link href={`/receitas/${recipe.id}/preparo`}>Modo preparo</Link>
        </Button>
      </div>
    </>
  );
}

/**
 * The water amount: a 100 mL stepper and the three quick chips.
 *
 * The volume lives in the device store, not in local state — it is the one
 * thing on this screen a student expects to survive closing the app, and the
 * store is the only place that persists anything. There is no local mirror, so
 * there is no second source of truth to drift.
 *
 * `setWaterMl`'s return value is deliberately ignored. It reports whether the
 * write reached localStorage, and the honest answer to a failure here is
 * nothing: the volume on screen is correct either way, every drop count below
 * it is correct either way, and all a student loses is two taps on the next
 * launch. A toast on every press of + would cost more than that.
 */
function WaterStepper({ waterMl }: { waterMl: number }) {
  return (
    <section
      aria-labelledby="water-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/* The one uppercase in the system: a mono, tracked overline. */}
      <h2
        id="water-heading"
        className="font-mono text-overline uppercase text-fg-3"
      >
        Quantidade de água
      </h2>

      <div className="flex items-center gap-3">
        <StepButton
          direction={-1}
          waterMl={waterMl}
          label="Diminuir água"
          disabled={waterMl <= WATER_MIN_ML}
        />
        {/* aria-live: the number changes under the student's finger and the
            buttons that change it keep focus, so nothing else would announce
            it. The unit is a separate, quieter span — the handoff's stepper. */}
        <p
          aria-live="polite"
          className="flex flex-1 items-baseline justify-center gap-1.5"
        >
          <span className="font-mono text-data-xl font-medium text-fg">
            {formatWhole(waterMl)}
          </span>
          <span className="font-mono text-data-md text-fg-2">mL</span>
        </p>
        <StepButton
          direction={1}
          waterMl={waterMl}
          label="Aumentar água"
          disabled={waterMl >= WATER_MAX_ML}
        />
      </div>

      {/*
        MILLILITRES EVERYWHERE, never "1 L". The handoff's `fmtVolume` switches
        unit at 1.000 mL, which in a 100 mL stepper means the hero number reads
        900 → 1 → 1,1 across two presses. One unit for the whole screen is what
        keeps the number comparable while it is being stepped, and it is how the
        S2 wireframe prints it ("1.000 mL").

        A single-select set of volumes, so `type="single"` — Radix gives it
        radio-group semantics and roving focus for free. Radix clears the value
        when the active item is tapped again; this is a volume, not a toggle, so
        an empty value is ignored (the same call S1's filter makes).
      */}
      <ToggleGroup
        type="single"
        value={WATER_PRESETS_ML.includes(waterMl) ? String(waterMl) : ""}
        onValueChange={(next) => next && setWaterMl(Number(next))}
        aria-label="Quantidades rápidas"
        className="w-full gap-2"
      >
        {WATER_PRESETS_ML.map((preset) => (
          <ToggleGroupItem
            key={preset}
            value={String(preset)}
            // h-tap-min, not the handoff's 32 px chip: this screen is used
            // with wet hands and 44 px is the floor the whole app holds to.
            // first/last-rounded are re-stated because the shared item squares
            // off the ends of a group by default.
            className="h-tap-min rounded-full first:rounded-l-full last:rounded-r-full border border-border-strong font-mono text-data-sm text-fg-2 data-[state=on]:border-mineral data-[state=on]:bg-mineral-soft data-[state=on]:text-mineral-soft-ink"
          >
            {formatWhole(preset)} mL
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  );
}

/** One end of the stepper. 48 px, tonal, with the handoff's icon-press scale. */
function StepButton({
  direction,
  waterMl,
  label,
  disabled,
}: {
  direction: 1 | -1;
  waterMl: number;
  /** pt-BR: it is read aloud. */
  label: string;
  disabled: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={() => setWaterMl(stepWaterMl(waterMl, direction))}
      className="size-12 shrink-0 bg-brand-soft text-brand-soft-ink hover:bg-brand-soft/80 active:scale-[.94]"
    >
      <Glyph name={direction > 0 ? "plus" : "minus"} className="size-5" />
    </Button>
  );
}

/**
 * One concentrate's dose — the hero of the screen.
 *
 * The drop count is the biggest thing on the row (`text-data-lg`, the handoff's
 * 28 px `ConcentrateVial`) and the millilitres are the quiet second line,
 * EXCEPT when the engine says otherwise: under 3 drops the count is too small
 * to measure by eye and over 60 it is too many to count, so `row.display`
 * swaps which unit leads. That decision is the engine's — read, never
 * re-derived here.
 *
 * A missing concentrate dims its identity and dashes its border, and keeps the
 * drop count at full ink. The recipe is never hidden and the row is never
 * emptied: a student who is one bottle short still gets to make the other two.
 */
function DoseRowCard({
  row,
  have,
  preparedOn,
  warning,
}: {
  row: DoseRow;
  /** `null` before the device state loads: neither owned nor missing. */
  have: boolean | null;
  /**
   * `state.prepared_on[row.concentrate_id]` — undefined before the device state
   * loads, and for a bottle S0 seeded without a date.
   */
  preparedOn: string | undefined;
  /** This row's engine warning in Juliana's Portuguese, if it raised one. */
  warning: string | undefined;
}) {
  // Only a KNOWN absence dims the row and dashes it. Unknown reads as the plain
  // card, which claims nothing either way.
  const missing = have === false;
  const leadsWithMl = row.display === "ml";

  return (
    <div
      className={cn(
        // Both states carry the SAME 1 px border box. The dashed warning rule is
        // 1,5 px and a border that thick is 1 px of extra card height — which
        // `missing` flips on hydration, so the dashed treatment was itself a
        // (small) layout shift on every cold launch, on top of the banner's.
        // An inset `outline` is the primitive for a rule that marks state
        // without occupying space: same 1,5 px, same dashes, same place (offset
        // −1,5 px puts its outer edge on the card edge, where the border was),
        // and no contribution to layout at all.
        "overflow-hidden rounded-lg border bg-surface",
        missing
          ? "border-transparent outline-[1.5px] outline-dashed outline-warning -outline-offset-[1.5px]"
          : "border-border shadow-xs",
      )}
    >
      <div className="flex min-h-tap-min items-center gap-3.5 px-4 py-3.5">
        <Vial have={have} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* label_pt verbatim, not through a <Formula>: docs/03 defines it as
              what the student writes on the bottle, and the row has to match
              the sticker they are reading on the counter. */}
          <span
            className={cn(
              "truncate font-mono text-data-sm font-medium",
              missing ? "text-fg-3" : "text-fg",
            )}
          >
            {row.label_pt}
          </span>
          <span className="truncate text-body-sm text-fg-3">
            {MINERAL_NAME_BY_ID.get(row.mineral_id)}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <p className="flex items-baseline gap-1">
            <span className="font-mono text-data-lg font-medium text-fg">
              {leadsWithMl ? formatMl(row.ml) : formatWhole(row.drops)}
            </span>
            <span className="font-mono text-data-xs text-fg-3">
              {leadsWithMl ? "mL" : dropsUnit(row.drops)}
            </span>
          </p>
          <p className="font-mono text-data-xs text-fg-3">
            {leadsWithMl
              ? `${formatWhole(row.drops)} ${dropsUnit(row.drops)}`
              : `${formatMl(row.ml)} mL`}
          </p>
        </div>
      </div>

      <RowNote
        row={row}
        missing={missing}
        preparedOn={preparedOn}
        warning={warning}
      />
    </div>
  );
}

/**
 * The row's note band — and the space it takes, held open on every row.
 *
 * ONE band per dose row, ONE line tall, present in every state: the prompt to
 * prepare a missing concentrate, the shelf-life ⚠, the engine's row-scoped
 * warnings, or the quiet prep date. Everything a dose row has to say under its
 * numbers says it here, and the band is the same height saying any of it or
 * nothing at all.
 *
 * **Why it is reserved at all.** Every input to this band comes from the device
 * store, which holds the server defaults for the whole hydration render (see
 * `haveConcentrate`): ownership, the prep date, and — through `drops_per_ml` and
 * `water_ml` — `row.high_drop_count`. A band rendered on that news grew every
 * dose row by its own height mid-launch, on the one screen a student reads with
 * wet hands, mid-count. Same failure as S1's shelf badge
 * (`app/receitas/recipe-list.tsx` § ShelfStatusPlaceholder) and as the status
 * slot S5 holds open (`app/concentrados/inventory.tsx` § Row).
 *
 * **Why ONE band and not one per note.** A boolean that can flip either way
 * across hydration needs its space reserved whether it ends up true or false —
 * there is no third option. Reserving a strip per note would have put two
 * permanently-empty strips (88 px) under every row a student owns and can
 * measure, which is the common row on the most-used screen. One slot the notes
 * share costs the 44 px that was already being held for the prepare banner, and
 * costs it only once. `rowNoteKind` (`./format.ts`) decides which note gets it
 * and documents the order; the price is that a missing row does not also print
 * the high-drop hint, whose numbers its hero and sub-line are already showing.
 *
 * **Why ONE line, strictly.** `min-h-tap-min` is a floor, so the band is 44 px
 * only while its text does not wrap — and two of these notes interpolate
 * store-derived numbers, so a wrap could differ between the two renders even
 * with the space reserved. `truncate` is what makes the line count a constant
 * instead of a function of the copy, the width and the device's calibration.
 * The copy is sized to fit a 390 px frame with room to spare; truncation is the
 * guarantee, not the plan.
 *
 * `invisible` (visibility: hidden) for the empty case, not `opacity-0`: it takes
 * the fill with it, drops the box out of the tab order, and keeps it out of the
 * accessibility tree — a student with nothing to be told is told nothing, by eye
 * or by screen reader.
 */
function RowNote({
  row,
  missing,
  preparedOn,
  warning,
}: {
  row: DoseRow;
  missing: boolean;
  preparedOn: string | undefined;
  warning: string | undefined;
}) {
  // The date maths lives in `app/concentrados/shelf-life.ts` — the inventory row
  // and this row ask the same question of the same two values, and RMP-256's
  // criterion is that both answer it the same way. Null here means the question
  // does not apply: no prep date (S0 can seed an inventory without one).
  const life = shelfLife(
    preparedOn,
    SHELF_LIFE_DAYS_BY_ID.get(row.concentrate_id) ?? Number.NaN,
  );

  const kind = rowNoteKind({
    missing,
    coveredByBase: row.covered_by_base,
    expired: life?.expired === true,
    highDropCount: row.high_drop_count,
    hasPrepDate: life !== null,
  });

  // One class string for every state, so the held box cannot drift from the
  // thing it is holding space for.
  const shape =
    "flex min-h-tap-min items-center gap-2 px-4 py-2.5 text-body-sm";

  // The only way out of a missing row in this phase. RMP-260 adds the in-row
  // substitution offer ("Usar NaHCO₃"), for the equivalences Juliana authored.
  if (kind === "missing") {
    return (
      <Link
        href={`/concentrados/${row.concentrate_id}`}
        className={cn(
          shape,
          "bg-warning-soft font-semibold text-warning-ink no-underline",
        )}
      >
        <span className="flex-1 truncate">Preparar concentrado</span>
        <Glyph name="chevron-right" className="size-4.5 shrink-0" />
      </Link>
    );
  }

  // The two row-scoped engine warnings, rendered where the student is looking.
  // Their copy — like every warning's — comes from `./warnings.ts`; the `&&` is
  // type narrowing, not a policy: `rowNoteKind` picked this kind off the very
  // row flags the engine raised the warning from, so the string is there.
  if (kind === "covered-by-base" && warning) {
    return (
      // The quiet treatment, not the warning one: the dose is simply zero and
      // the water is already right. Nothing for the student to do about it.
      <p className={cn(shape, "bg-surface-sunken text-fg-2")}>
        <span className="truncate">
          <Quantities text={warning} />
        </span>
      </p>
    );
  }

  // RMP-256: past its shelf life, the inventory row AND every recipe row using
  // the bottle carry the ⚠ — and the row still computes. Nothing above this
  // reads `expired`: the drop count, the millilitres and *Modo preparo* are
  // exactly what they were. Same sentence as S5's row
  // (`app/concentrados/inventory.tsx` § OwnedStatus), so a student who checks
  // the shelf after reading this finds the words they just read.
  if (kind === "expired" && life) {
    return (
      <p className={cn(shape, "bg-warning-soft text-warning-ink")}>
        {/* The glyph never carries the meaning on its own — it is decorative and
            the sentence beside it is the message, which is also what a screen
            reader and a student who cannot tell orange from grey get. */}
        <Glyph name="triangle-alert" className="size-4 shrink-0" />
        <span className="truncate font-medium">
          Venceu em{" "}
          <span className="font-mono text-data-sm">
            {formatBrDate(life.expiresOn)}
          </span>
          .
        </span>
      </p>
    );
  }

  if (kind === "high-drop-count" && warning) {
    return (
      <p className={cn(shape, "bg-warning-soft text-warning-ink")}>
        <span className="truncate">
          <Quantities text={warning} />
        </span>
      </p>
    );
  }

  if (kind === "prepared-on" && preparedOn) {
    return (
      <p className={cn(shape, "text-fg-3")}>
        <span className="truncate">
          Preparado em{" "}
          <span className="font-mono text-data-sm">
            {formatBrDate(preparedOn)}
          </span>
          .
        </span>
      </p>
    );
  }

  // Nothing to say: an owned bottle with no prep date, and every row on the
  // hydration render. The box stays, exactly as tall as it would be with the
  // longest note in it — one line.
  return (
    <div aria-hidden className={cn(shape, "invisible")}>
      <span className="truncate">Preparar concentrado</span>
    </div>
  );
}

/**
 * The ONE summary line: GH and KH as ppm CaCO3, with the individual ions a tap
 * away.
 *
 * ppm-of-salt is never shown anywhere in the app, and the ion figures stay
 * behind *Ver íons* because GH/KH is what SCA charts, test strips and Juliana's
 * own slides use. Both numbers are rounded: a student reads them against a test
 * strip, not a spreadsheet.
 */
function Summary({
  gh,
  kh,
  ions,
  tds,
}: {
  gh: number;
  kh: number;
  ions: IonProfile;
  tds: number;
}) {
  // A plain <div>, not a <section>: the summary has no heading of its own, and
  // an unnamed landmark is noise to a screen reader.
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-data-md text-fg">
          GH {formatWhole(gh)} · KH {formatWhole(kh)}
        </p>
        <Sheet>
          <SheetTrigger className="-mr-2 flex min-h-tap-min cursor-pointer items-center gap-1 px-2 text-body-sm font-semibold text-link">
            Ver íons
            <Glyph name="chevron-right" className="size-4" />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            closeLabel="Fechar"
            className="mx-auto max-w-content gap-0 rounded-t-sheet bg-surface pb-8"
          >
            <SheetHeader className="gap-1 px-4 pb-2">
              <SheetTitle className="text-h3 text-fg">
                Íons na água pronta
              </SheetTitle>
              <SheetDescription className="text-body-sm text-fg-2">
                Em mg/L do íon. Inclui os íons que vêm junto com cada sal.
              </SheetDescription>
            </SheetHeader>
            <dl className="px-4">
              {ION_ORDER.filter((ion) => (ions[ion] ?? 0) > 0).map((ion) => (
                <div
                  key={ion}
                  className="flex items-baseline justify-between gap-4 border-b border-divider py-2.5 last:border-b-0"
                >
                  <dt className="font-mono text-data-sm text-fg">
                    <IonLabel ion={ion} />
                  </dt>
                  <dd className="font-mono text-data-md text-fg">
                    {formatMgPerL(ions[ion] ?? 0)}{" "}
                    <span className="text-data-xs text-fg-3">mg/L</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="px-4 pt-3 text-body-sm text-fg-2">
              TDS estimado em{" "}
              <span className="font-mono text-data-sm text-fg">
                {formatWhole(tds)} mg/L
              </span>
              . É uma estimativa da soma dos íons. Não compare com um medidor.
            </p>
          </SheetContent>
        </Sheet>
      </div>
      <p className="text-body-sm text-fg-3">
        Dureza e alcalinidade em ppm de CaCO
        <Sub>3</Sub>. Não mudam com a quantidade de água.
      </p>
    </div>
  );
}

/**
 * The order the salts go into the jug: starting water first, bicarbonate last,
 * then shake.
 *
 * Fixed text at the bottom of the screen, never behind an info icon — it is the
 * step students get wrong, and a tap is one too many with a jug in one hand.
 * The sequence is `recipe.concentrate_ids`, which the importer already
 * guarantees is in Juliana's mixing order, so there is no sort here to disagree
 * with the engine's row order.
 *
 * NO quantities. The drop counts live in exactly one place on this screen; S3
 * (RMP-257) is the one that repeats them as tiles to tick off.
 */
function MixingOrder({ rows }: { rows: DoseRow[] }) {
  const steps = [
    "Água de partida",
    ...rows.map((row) => row.label_pt),
    "Agite por 10 segundos",
  ];

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-h3 font-semibold text-fg">Ordem de mistura</h2>
      {/* An <ol>, so the order is carried by the markup and not only by the
          numbers — and numbered rather than chained with arrows, because
          U+2192 falls outside the latin woff2 subsets @salis/tokens loads and
          would come back from a fallback font mid-line. */}
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-xs bg-brand-soft font-mono text-data-xs font-medium text-brand-soft-ink">
              {index + 1}
            </span>
            <span className="font-mono text-data-sm text-fg">{step}</span>
          </li>
        ))}
      </ol>
      <p className="text-body-sm text-fg-2">
        O bicarbonato entra sempre por último.
      </p>
    </section>
  );
}

/**
 * The handoff's concentrate vial (`components/recipe/ConcentrateVial.jsx`): a
 * bordered tube with a fill level, built from CSS rather than drawn as an icon
 * so it can carry the have/lack state. Decorative — the row's own copy says
 * which concentrate it is and whether it is missing.
 *
 * 14 × 30 px with a 1,5 px rule and the handoff's asymmetric corners, none of
 * which are on a Tailwind scale.
 */
function Vial({ have }: { have: boolean | null }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-7.5 w-3.5 shrink-0 overflow-hidden rounded-t-[3px] rounded-b-[7px] border-[1.5px] bg-surface",
        have === null
          ? "border-border"
          : have
            ? "border-brand"
            : "border-dashed border-warning",
      )}
    >
      {/* The fill is the brand SOFTENED, not a raw scale step. `bg-teal-300` was
          hardcoded here and the dark theme remaps `--brand` to exactly that
          step (`packages/salis-tokens/styles/foundation.css`), so rim and fill
          collapsed into one solid capsule and the vial stopped showing a level
          at all. Compositing the same token toward the surface can never
          collapse: the rim is the dense teal and the fill the soft one in
          whichever direction the theme runs. */}
      {have === true && (
        <span className="absolute inset-x-0 bottom-0 h-[62%] bg-brand/40" />
      )}
      <span
        className={cn(
          "absolute inset-x-[-1px] top-0 h-1",
          have === null
            ? "bg-surface-sunken"
            : have
              ? "bg-brand"
              // Dashed rule under the cap, matching S5 and the handoff's
              // ConcentrateVial — an empty tube reads as empty, not just pale.
              : "border-b-[1.5px] border-dashed border-warning bg-warning-soft",
        )}
      />
    </span>
  );
}

/**
 * A chemistry subscript, with the handoff's metrics (`Formula.jsx`).
 *
 * A real `<sub>`, never the Unicode subscript block: those glyphs are outside
 * the latin woff2 subsets `@salis/tokens` ships, so `CaCO₃` typed in Unicode
 * would render from whatever fallback the device has. The zero line-height is
 * what stops the subscript from growing the line box.
 */
function Sub({ children }: { children: string }) {
  return (
    <sub className="text-[0.68em] leading-[0] align-[-0.28em]">{children}</sub>
  );
}

/** An ion as the sheet prints it, with real subscripts where the ion has one. */
function IonLabel({ ion }: { ion: IonKey }) {
  switch (ion) {
    case "HCO3":
      return (
        <>
          HCO
          <Sub>3</Sub>
        </>
      );
    case "SO4":
      return (
        <>
          SO
          <Sub>4</Sub>
        </>
      );
    case "citrate":
      return <>citrato</>;
    default:
      return <>{ion}</>;
  }
}

/**
 * The four glyphs this screen needs, from the handoff's Lucide subset.
 *
 * Not added to `app/icons.tsx`: that map is the navigation frame's, shared with
 * screens other sub-issues own. Decorative in every use here — each control
 * carries its own accessible name, and the shelf-life ⚠ has the sentence beside
 * it (the same call `prep-status.tsx` made for its check mark).
 *
 * Each entry is ONE `d`, so a multi-subpath glyph concatenates its subpaths
 * rather than growing this into a list-of-paths map: `triangle-alert` is the
 * body, the stem and the dot, all stroked identically. The handoff bans emoji
 * and Unicode pictographs as icons, so the plan's `⚠` is drawn, not typed.
 */
const GLYPH_PATHS = {
  minus: "M5 12h14",
  plus: "M5 12h14M12 5v14",
  "chevron-right": "m9 18 6-6-6-6",
  "triangle-alert":
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01",
} satisfies Record<string, string>;

function Glyph({
  name,
  className,
}: {
  name: keyof typeof GLYPH_PATHS;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={GLYPH_PATHS[name]} />
    </svg>
  );
}
