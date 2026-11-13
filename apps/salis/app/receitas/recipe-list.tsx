"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@crivelo/ui/badge";
import { EmptyState } from "@crivelo/ui/empty-state";
import { ToggleGroup, ToggleGroupItem } from "@crivelo/ui/toggle-group";
import { cn } from "@crivelo/ui/lib/utils";
import type { Recipe } from "@/engine/types";
import { content } from "../content";
import { useDeviceStore } from "../device-store";
import { countMissing } from "./missing";

/** Which collection the segmented control is showing. */
type Collection = "juliana" | "mine";

/**
 * One segment of the control. `h-8` inside the group's 3 px padding is the
 * handoff's 40 px SegmentedControl; `rounded-[7px]` is its
 * `calc(radius-md - 3px)`, off the scale and so written as an arbitrary.
 */
// h-8 is the handoff SegmentedControl's default ("md"), NOT the size="sm"
// that HomeScreen.jsx uses for its own tab row. Deliberate: HomeScreen's four
// tabs are single short words, while "Receitas da Juliana" is three — at sm's
// 24px item height that label crowds its own box. Revisit if the labels get
// shorter.
const SEGMENT_CLASS =
  "h-8 flex-1 rounded-[7px] text-body-sm font-semibold text-fg-2 data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-xs data-[state=on]:ring-1 data-[state=on]:ring-border";

/**
 * S1's body: Juliana's recipes, and the student's own.
 *
 * A Client Component because both halves of the screen read device-local state:
 * the cards count what the shelf is missing, and the filter is a local choice.
 * `content` is imported here rather than passed down from the page — the device
 * store already pulls it into the client bundle, so a prop would only duplicate
 * it into the RSC payload as well.
 *
 * ORDER IS THE WHOLE DESIGN (`docs/01-v1-plan.md` § Screens): sensory name
 * first, what's missing second, chemistry last. The name and the promise are
 * what a student remembers from class; GH/KH is the one summary line, and it
 * sits below the lab-notebook rule in the quietest type on the card.
 *
 * The store is read ONCE here, not per card. Every card asks the same question
 * of the same inventory, so one `useSyncExternalStore` subscription answers all
 * of them — and the whole list then re-renders together when S5 toggles a
 * concentrate, instead of five independent subscriptions settling one by one.
 */
export function RecipeList() {
  const [collection, setCollection] = useState<Collection>("juliana");
  const { state, loaded } = useDeviceStore();

  return (
    <div className="flex flex-col gap-4 px-gutter pb-6">
      <ToggleGroup
        type="single"
        value={collection}
        // Radix's single-selection group clears the value when the active item
        // is tapped again. This is a filter, not a toggle: there is no "neither
        // collection" state to show, so an empty value is ignored.
        onValueChange={(next) => next && setCollection(next as Collection)}
        aria-label="Filtrar receitas"
        // p-[3px] is the handoff's SegmentedControl padding, off the 4 px scale.
        // gap-0.5 is its 2 px gap, an exact scale match.
        className="w-full gap-0.5 rounded-md border border-border bg-surface-sunken p-[3px]"
      >
        <ToggleGroupItem value="juliana" className={SEGMENT_CLASS}>
          Receitas da Juliana
        </ToggleGroupItem>
        {/* Always (0): a saved recipe needs the S6 builder (RMP-264) and a field
            in the device store to hold it, and neither exists yet. The count is
            wired to nothing on purpose rather than derived from something that
            does not mean the same thing. */}
        <ToggleGroupItem value="mine" className={SEGMENT_CLASS}>
          Minhas (0)
        </ToggleGroupItem>
      </ToggleGroup>

      {collection === "juliana" ? (
        <ul className="flex flex-col gap-3">
          {content.recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                // null until the device state has loaded: the store starts at
                // its defaults (an empty shelf) and reads storage after mount,
                // so counting eagerly would flash "falta 3" at a student who
                // owns everything.
                missing={
                  loaded
                    ? countMissing(
                        recipe.concentrate_ids,
                        state.owned_concentrate_ids,
                      )
                    : null
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhuma receita sua"
          description="Uma receita sua parte de uma receita da Juliana: você ajusta as gotas de cada concentrado e salva com um nome."
          // No action: the S6 builder is RMP-264. `EmptyState` now hangs the
          // description's bottom margin off `action`, so there is nothing to
          // undo here.
        />
      )}
    </div>
  );
}

/**
 * One recipe, as the handoff's RecipeCard: white surface, 1 px border, radius
 * 14, `shadow-xs`, and a 1 px **dashed** rule separating the words from the
 * numbers (the lab-notebook detail in `.design/project/readme.md` § Cards).
 *
 * The card is a `Link` carrying those utilities rather than a `Card` wrapping
 * one: the whole card is the tap target (wet hands), `Card` is a plain `div`
 * with no `asChild`, and every one of its shadcn defaults — `rounded-xl`,
 * `py-6`, `gap-6`, `shadow-sm` — is the wrong value here and would have to be
 * overridden anyway.
 *
 * `missing` is `null` while the device state is still loading; see the call
 * site.
 */
function RecipeCard({
  recipe,
  missing,
}: {
  recipe: Recipe;
  missing: number | null;
}) {
  return (
    // text-fg / no-underline: the foundation paints every bare <a> in link blue
    // and underlines it on hover (foundation.css § base). A card is ink.
    // scale-[.99] is the handoff's card press, off Tailwind's scale steps.
    <Link
      href={`/receitas/${recipe.id}`}
      className="block rounded-lg border border-border bg-surface p-4 text-fg no-underline shadow-xs transition-transform duration-120 ease-standard active:scale-[.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-h3 font-semibold text-fg">
            {recipe.name_pt}
          </span>
          {/* RMP-263 adds the "espresso ok" badge beside the name, for the
              recipes Juliana marked `espresso_safe`. */}
          <span className="text-pretty text-body-sm text-fg-2">
            {recipe.promise_pt}
          </span>
        </div>
        {/* RMP-262 adds the 56 px sensory-plane thumbnail here. Nothing is
            reserved for it: an empty box would read as a broken image, and the
            text column is already the flexible half of this row. */}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-dashed border-border-strong pt-3">
        {/* Rounded, because a student reads this against a test strip, not a
            spreadsheet. Both stay well under 1.000, so there is no pt-BR
            thousands separator to format. */}
        <span className="font-mono text-data-sm text-fg-2">
          GH {Math.round(recipe.gh_caco3)} · KH {Math.round(recipe.kh_caco3)}
        </span>
        {missing !== null ? (
          <ShelfStatus missing={missing} />
        ) : (
          <ShelfStatusPlaceholder />
        )}
      </div>
    </Link>
  );
}

/**
 * What the student is still missing for this recipe — the second thing the card
 * says, before any chemistry.
 *
 * Mono for both labels: the count is a quantity, and `tnum` (which rides the
 * `font-mono` utility — see `packages/salis-tokens/CLAUDE.md` § Type) keeps the
 * badge from changing width as the inventory changes.
 *
 * `variant="ghost"` is the Badge variant that paints no fill of its own, so the
 * soft tone below is an addition rather than an override. Warning orange is the
 * handoff's language for a missing concentrate; honey is never a status colour.
 */
/**
 * Worn by the badge and by its placeholder, so the two occupy the same box by
 * construction rather than by two numbers kept in sync. `rounded-xs` is the
 * handoff's badge radius (4 px).
 */
const SHELF_BADGE_CLASS = "rounded-xs font-mono text-data-xs font-medium";

function ShelfStatus({ missing }: { missing: number }) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        SHELF_BADGE_CLASS,
        missing === 0
          ? "bg-success-soft text-success-ink"
          : "bg-warning-soft text-warning-ink",
      )}
    >
      {/* Portuguese agrees the verb with the subject: one missing concentrate
          "falta", two or more "faltam". The plan's ASCII wireframe writes
          "falta 2", but that is a sketch, not a copy deck — shipping it would
          put a grammar error in front of the students of the teacher whose
          course this is. */}
      {missing === 0 ? "tudo ok" : missing === 1 ? "falta 1" : `faltam ${missing}`}
    </Badge>
  );
}

/**
 * The badge's box, held open while the device state loads.
 *
 * This row is the app's home screen and `missing` is `null` for the first frame
 * of every cold launch, so without this the chip was absent on paint and then
 * appeared on all five cards at once. The badge is 2 px taller than the GH/KH
 * line beside it (16 px line-height + `py-0.5` + the variant's transparent
 * border, against that line's 20 px), which is 2 px of growth per card and a
 * visible shift of the whole list on every single launch.
 *
 * The widest label it can be replaced by, rendered in the badge's own classes
 * with the ink taken out: the footprint is then exactly right by construction,
 * for height and for width. `tnum` makes "faltam 2" stand for any count.
 * Muted and still on purpose — a spinner on five rows would be louder than the
 * reflow it replaces — and `aria-hidden`, because it is a held space, not a
 * status: a reader meets the real badge when there is one to meet.
 */
function ShelfStatusPlaceholder() {
  return (
    <Badge
      variant="ghost"
      aria-hidden="true"
      className={cn(SHELF_BADGE_CLASS, "bg-surface-sunken text-transparent")}
    >
      faltam 2
    </Badge>
  );
}
