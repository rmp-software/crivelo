"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@crivelo/ui/lib/utils";
import type { Concentrate } from "@/engine/types";
import { content } from "../content";
import { useDeviceStore } from "../device-store";
import { formatBrDate } from "./[concentrateId]/prep-content";
import { shelfLife } from "./shelf-life";

/**
 * S5 · Concentrados — the shelf.
 *
 * Two sections, straight from the wireframe in `docs/01-v1-plan.md` § Screens:
 * what the student has (with prep dates and the shelf-life ⚠) and what they do
 * not (with what each one would unlock). This is the state behind every dimmed
 * recipe row in the app, which is why every row — owned or not — is a link to
 * the same place: the prep screen for that concentrate.
 *
 * A Client Component because the whole partition is device state. The store is
 * read ONCE here rather than per row, as `app/receitas/recipe-list.tsx` does
 * for the same reason: every row asks the same question of the same inventory,
 * so one subscription answers all of them and the list re-renders together.
 *
 * **An expired bottle is still a bottle.** The ⚠ is one line on the row and
 * nothing else: no dimming, no disabled link, no removal from "Tenho". The plan
 * is explicit (§ Calculation rules: "past it … carry ⚠ but still compute"), and
 * the drops a recipe asks for are computed from the concentrate's ion yield,
 * which this screen does not touch.
 */

const MINERAL_BY_ID = new Map(
  content.minerals.map((mineral) => [mineral.id, mineral]),
);

/**
 * How many of Juliana's recipes list this concentrate — the "libera N receitas"
 * of the wireframe, and the one number an unowned row carries.
 *
 * `app/onboarding/unlocking-concentrate.ts` computes the same count inside its
 * loop, and S4's header does it inline too. It is NOT imported here because
 * that function answers a different question — "which single concentrate wins?"
 * — and returns only the winner, so there is no per-concentrate count to reuse.
 * Lifting the shared one-liner into a module both screens import means editing
 * `app/onboarding/`, which this sub-issue does not own; see the report.
 */
function recipesUnlockedBy(concentrateId: string): number {
  return content.recipes.filter((recipe) =>
    recipe.concentrate_ids.includes(concentrateId),
  ).length;
}

/**
 * The bottle this one stands in for, when it unlocks no recipe of its own.
 *
 * The wireframe's third unowned row reads "substitui Mg", and with the content
 * committed today that is a real case: `mgcl2-30k` appears in none of the five
 * recipes and exists only as Juliana's substitute for `mg-30k`. "Libera 0
 * receitas" would be true and useless — it reads as "do not bother" about a
 * bottle her own equivalence rules recommend.
 *
 * **First rule wins, deliberately.** `docs/03-content-schema.md` does not make
 * `to_mineral_id` unique, so a second substitute for the same mineral is
 * authorable; today Juliana ships exactly one per mineral. The tie-break is
 * content order — the row names the first substitute she listed, which is the
 * order she chose. `app/onboarding/unlocking-concentrate.ts`
 * § findUnlockingConcentrate makes the same call explicitly for its own ties.
 * One name, not a list: the slot is one line.
 */
function substituteFor(concentrate: Concentrate): string | null {
  const rule = content.equivalences.find(
    (equivalence) => equivalence.to_mineral_id === concentrate.mineral_id,
  );
  if (!rule) return null;
  const origin = content.concentrates.find(
    (candidate) => candidate.mineral_id === rule.from_mineral_id,
  );
  return origin?.label_pt ?? null;
}

export function Inventory() {
  const { state, loaded } = useDeviceStore();

  /**
   * Which section a bottle belongs to is the ONE thing this screen cannot know
   * before the device state arrives, so until it does, no row claims a section:
   * the headings are held open as blank lines and the rows render with a
   * neutral vial and an empty status slot. Everything a row shows in this state
   * — the label, the mineral name — is content, identical before and after, so
   * nothing has to be swapped out and nothing false is shown to a student who
   * owns all five. Only the headings and the status lines fill in.
   *
   * Reserving rather than withholding is the lesson from S1's shelf badge: five
   * rows appearing at once after paint moved the whole list on every cold
   * launch.
   */
  if (!loaded) {
    return (
      <Shelf>
        <div className="flex flex-col gap-2.5">
          <div aria-hidden="true" className="h-6" />
          <ul className="flex flex-col gap-2.5">
            {content.concentrates.map((concentrate) => (
              <Row
                key={concentrate.id}
                concentrate={concentrate}
                have={null}
                status={null}
              />
            ))}
          </ul>
        </div>
        <div aria-hidden="true" className="h-6" />
      </Shelf>
    );
  }

  const ownedIds = new Set(state.owned_concentrate_ids);
  const owned = content.concentrates.filter((item) => ownedIds.has(item.id));
  const missing = content.concentrates.filter((item) => !ownedIds.has(item.id));

  return (
    <Shelf>
      <Section title="Tenho" count={owned.length}>
        {owned.map((concentrate) => (
          <Row
            key={concentrate.id}
            concentrate={concentrate}
            have={true}
            status={
              <OwnedStatus
                preparedOn={state.prepared_on[concentrate.id]}
                shelfLifeDays={concentrate.shelf_life_days}
              />
            }
          />
        ))}
      </Section>

      <Section title="Ainda não tenho" count={missing.length}>
        {missing.map((concentrate) => (
          <Row
            key={concentrate.id}
            concentrate={concentrate}
            have={false}
            status={<LackStatus concentrate={concentrate} />}
          />
        ))}
      </Section>
    </Shelf>
  );
}

function Shelf({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 px-gutter pb-6">{children}</div>
  );
}

/** "Tenho (3)" — the count is a quantity, so it is mono like every other one. */
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-h3 font-semibold text-fg">
        {title}{" "}
        <span className="font-mono text-data-sm font-normal text-fg-3">
          ({count})
        </span>
      </h2>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </section>
  );
}

/**
 * One bottle.
 *
 * The whole row is the tap target and it always leads to the same place —
 * S4, the prep recipe — whether the student has the bottle or not. For a
 * missing one that is how they get it; for one they have it is where the label
 * text, the storage note and the shelf life are written down.
 *
 * Three lines, always, so the row's height never depends on device state: the
 * label, the mineral name, and a status slot held open at one line
 * (`h-5` = the 20 px line-height of `text-body-sm`). Everything that varies
 * — the prep date, the ⚠, "libera N receitas" — lives in that slot.
 *
 * `have` is `null` before the device state loads: neither owned nor missing,
 * and the slot is empty.
 */
/*
 * The card border stays solid for owned AND unowned rows, deliberately. The
 * handoff's ConcentrateVial dashes the MISSING state, and S2's dose rows do
 * exactly that — but S2 interleaves owned and missing rows in one list, so the
 * card itself has to carry the state. Here the two sections already separate
 * them by construction, and the vial glyph carries it again at the row level.
 * A third signal would be noise, not clarity.
 */
function Row({
  concentrate,
  have,
  status,
}: {
  concentrate: Concentrate;
  have: boolean | null;
  status: ReactNode;
}) {
  const mineral = MINERAL_BY_ID.get(concentrate.mineral_id);
  return (
    <li>
      {/* text-fg / no-underline: the foundation paints a bare <a> in link blue
          and underlines it on hover. A row is ink. scale-[.99] is the handoff's
          card press, off Tailwind's scale steps. */}
      <Link
        href={`/concentrados/${concentrate.id}`}
        className="flex min-h-tap-min items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-fg no-underline shadow-xs transition-transform duration-120 ease-standard active:scale-[.99]"
      >
        <Vial have={have} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-mono text-data-md font-medium text-fg">
            {concentrate.label_pt}
          </span>
          {/* truncate: "Sulfato de magnésio (sal de Epsom)" is the longest of
              the six and would wrap to two lines on a 390 px frame, which is
              the one thing that would make rows differ in height. */}
          {mineral && (
            <span className="truncate text-body-sm text-fg-2">
              {mineral.name_pt}
            </span>
          )}
          {/* h-5, not min-h-5: a line box holding BOTH a sans run and a mono
              one is ~0,5 px taller than an all-sans one — the two fonts are
              baseline-aligned and their ascent/descent differ — so once the
              dates and the count moved to the mono data scale, a row with a
              number in its slot stood 0,5 px taller than one without. The slot
              is one line by construction (`text-body-sm` and `text-data-sm` are
              both 14/20), so fixing its height costs nothing and makes the
              row's geometry independent of what the slot says. */}
          <span className="flex h-5 items-center gap-1 text-body-sm">
            {status}
          </span>
        </span>
        <ChevronGlyph />
      </Link>
    </li>
  );
}

/** The prep date, or the ⚠ once the bottle is past its shelf life. */
function OwnedStatus({
  preparedOn,
  shelfLifeDays,
}: {
  preparedOn: string | undefined;
  shelfLifeDays: number;
}) {
  const life = shelfLife(preparedOn, shelfLifeDays);

  // Owned with no prep date: S0 seeds an inventory without one, so there is
  // nothing to count from and nothing to warn about. The row says what it knows.
  if (!preparedOn || !life) {
    return <span className="text-fg-3">Você tem este concentrado.</span>;
  }

  if (life.expired) {
    return (
      <>
        {/* The glyph never carries the meaning on its own — it is decorative and
            the sentence beside it is the message, which is also what a screen
            reader and a student who cannot tell orange from grey get. */}
        <WarningGlyph />
        {/* The date is a quantity, so it is set in the mono data scale like
            every other number — `docs/01-v1-plan.md` § "mono type marks
            quantities", and the same call S4's prep status makes
            (`./[concentrateId]/prep-status.tsx`). `text-data-sm` is 14/20, the
            same metrics as the `text-body-sm` sentence around it, so the mono
            run cannot change the row's single-line status slot. */}
        <span className="font-medium text-warning-ink">
          Venceu em{" "}
          <span className="font-mono text-data-sm">
            {formatBrDate(life.expiresOn)}
          </span>
          .
        </span>
      </>
    );
  }

  return (
    <span className="text-fg-3">
      Preparado em{" "}
      <span className="font-mono text-data-sm">{formatBrDate(preparedOn)}</span>
      .
    </span>
  );
}

/** What preparing this one would buy the student. */
function LackStatus({ concentrate }: { concentrate: Concentrate }) {
  const unlocks = recipesUnlockedBy(concentrate.id);
  if (unlocks > 0) {
    return (
      <span className="text-fg-3">
        {/* Portuguese agrees the noun with the number, as S1's shelf badge
            does: one recipe is "1 receita", more than one "N receitas". The
            count itself is mono (S1's badge again, and `docs/01-v1-plan.md`
            § "mono type marks quantities"); only the digits, so the sentence
            stays a sentence. */}
        Libera{" "}
        <span className="font-mono text-data-sm">{unlocks}</span>{" "}
        {unlocks === 1 ? "receita" : "receitas"}.
      </span>
    );
  }

  const substitute = substituteFor(concentrate);
  return substitute ? (
    <span className="text-fg-3">Substitui o {substitute}.</span>
  ) : null;
}

/**
 * The have/lack glyph, from the handoff's `components/recipe/ConcentrateVial`:
 * a 14 × 30 tube with a 4 px cap, filled and teal-bordered when the student has
 * it, empty with a dashed warning border when they do not.
 *
 * Shape, not just colour, carries the state (solid + filled vs. dashed +
 * empty), and the section heading above carries it in words — so it is
 * decorative and `aria-hidden`.
 *
 * `h-7.5 w-3.5` are 30 and 14 px, exact steps on the 4 px scale. The 3/7 px
 * corners, the 1.5 px rule and the 62 % fill level are the handoff's own
 * values and sit off every Tailwind scale.
 */
function Vial({ have }: { have: boolean | null }) {
  return (
    <span
      aria-hidden="true"
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
      {/* -left-px -right-px: the cap sits ON the tube's 1.5 px rule, so it has
          to overhang it rather than start inside it. */}
      <span
        className={cn(
          "absolute top-0 -right-px -left-px h-1",
          have === null
            ? "bg-surface-sunken"
            : have
              ? "bg-brand"
              : "border-b-[1.5px] border-dashed border-warning bg-warning-soft",
        )}
      />
    </span>
  );
}

/**
 * Lucide `triangle-alert` and `chevron-right`, inlined.
 *
 * Not added to `app/icons.tsx`: that map is documented as the navigation
 * frame's four glyphs, shared with screens other sub-issues own. Both are
 * `aria-hidden` — the sentence beside the triangle is the warning, and the
 * chevron only says the row is a link, which the `<a>` already says.
 *
 * The handoff bans emoji and Unicode pictographs as icons, so the plan's `⚠`
 * and `›` are drawn, not typed.
 */
function Glyph({
  children,
  className,
  stroke = 2,
}: {
  children: ReactNode;
  className: string;
  stroke?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function WarningGlyph() {
  return (
    <Glyph className="size-4 text-warning-ink">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

function ChevronGlyph() {
  return (
    <Glyph className="size-5 text-fg-3" stroke={1.75}>
      <path d="m9 18 6-6-6-6" />
    </Glyph>
  );
}
