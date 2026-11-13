/**
 * Juliana's pt-BR copy for the engine's warning codes — the one place it lives.
 *
 * `engine/dosing.ts` emits `{ code, context }` and no Portuguese on purpose: a
 * pure module has no business holding copy, and Phase 3 of the build order has
 * Juliana reviewing every string, so the strings have to sit somewhere she can
 * be pointed at. This is that somewhere, and it is in the APP layer for the same
 * reason — nothing under `engine/` is allowed to know what language the user
 * reads.
 *
 * **Exhaustiveness is a compile error, not a convention.** `WARNING_COPY` is a
 * total `Record<WarningCode, …>`, so adding a code to the union without copy
 * fails `tsc`. `warnings.test.ts` asserts the same thing at runtime as well,
 * because a map entry can exist while the screen never reaches it: half these
 * codes are row-scoped and travel a different path to the DOM than the other
 * half.
 *
 * **Scope is a property of the code, not a thing a caller remembers.** A
 * recipe-scoped warning is about the finished water and belongs in the list
 * under the summary; a row-scoped one is about one bottle and belongs on that
 * bottle's row, where the student is actually looking mid-count. Reading it off
 * the mapping is what stops a future code from landing in the wrong place
 * because whoever added it only edited one call site.
 *
 * **Plain strings, no JSX.** The node test environment has no DOM
 * (`vitest.config.ts`), the sentences are reviewed as sentences, and the one
 * typographic rule they need — mono digits — is applied mechanically by the
 * renderer (`recipe-counter.tsx` § Quantities), not spelled out per string.
 */
import type { Warning, WarningCode, WarningContext } from "@/engine/dosing";
import type { TargetIon } from "@/engine/types";
import { formatMl, formatWhole } from "./format";

/** Where the sentence renders: the recipe's list, or the dose row's note band. */
export type WarningScope = "recipe" | "row";

interface WarningCopy<C extends WarningCode> {
  scope: WarningScope;
  /**
   * The sentence.
   *
   * A function ONLY where the engine's context makes it concretely more useful
   * — how many drops, which ion. The three codes whose sentence says everything
   * it has to say without a number stay plain strings; manufacturing a
   * parameter for them would just be a lie about what the copy depends on.
   *
   * The parameter is THIS code's context, not a bag: `WarningContext<C>` comes
   * off the engine's discriminated union, so a field renamed in `dosing.ts`
   * fails `tsc` right here instead of formatting `NaN` onto a dose row.
   */
  text: string | ((context: WarningContext<C>) => string);
}

/**
 * The target ions in Juliana's words.
 *
 * The *ver íons* sheet prints formulas (Ca²⁺, HCO₃⁻) because it is a table of
 * chemistry; a sentence in the middle of a dose row is not, so it says
 * "Bicarbonato".
 */
const ION_NAME_PT: Record<TargetIon, string> = {
  Ca: "Cálcio",
  Mg: "Magnésio",
  HCO3: "Bicarbonato",
  Na: "Sódio",
  K: "Potássio",
};

export const WARNING_COPY: { [C in WarningCode]: WarningCopy<C> } = {
  // Row-scoped: the context names one concentrate, and so does the sentence's
  // position on screen.
  base_water_covers: {
    scope: "row",
    // `context.ion` is a `TargetIon` on the engine's union, so the lookup is
    // total and there is no "unknown ion" branch to write.
    text: (context) => `${ION_NAME_PT[context.ion]} já presente na água de partida.`,
  },
  high_drop_count: {
    scope: "row",
    // The hero number has already switched to millilitres by the time this
    // shows (the engine's >60 rule), so the band's job is to say why and point
    // at the syringe — not to restate both figures.
    text: (context) =>
      `Mais de ${formatWhole(context.ceiling)} gotas. Meça ${formatMl(
        context.ml,
      )} mL na seringa.`,
  },

  // Recipe-scoped: properties of the finished water, not of any one bottle.
  precipitation_risk: {
    scope: "recipe",
    // NOT "no frasco": a *frasco* is a concentrate's own dropper bottle, and
    // the thing it is warned about there (`content.json` § ca-30k storage_note)
    // is two salts reacting at STOCK strength — a different, worse hazard that
    // the app structurally prevents by keeping them in separate bottles
    // (`docs/content-assumptions.md` §5). This guard measures Ca × HCO3 in the
    // FINISHED, DILUTED water, which the summary two sections up already calls
    // *a água pronta*.
    text:
      "Cálcio e bicarbonato altos na mesma água. Pode deixar um depósito branco na água pronta.",
  },
  kh_below_floor: {
    scope: "recipe",
    text: "Alcalinidade baixa. A água pode ficar ácida.",
  },
  kh_above_ceiling: {
    scope: "recipe",
    text: "Alcalinidade alta. A água pode ficar chata.",
  },
};

/**
 * The sentence for one warning — the only road from a code to the screen.
 *
 * Total by construction: `WARNING_COPY` is keyed by the union, so there is no
 * "unknown code" branch here and no way for `base_water_covers` to reach a
 * student as `base_water_covers`.
 */
export function warningText(warning: Warning): string {
  return textFor(warning.code, warning.context);
}

/**
 * Pick the copy for one code and feed it that code's own context.
 *
 * Generic because `WARNING_COPY[warning.code]` on an un-narrowed `Warning`
 * collapses to a union of builders whose parameters no single argument
 * satisfies. Binding `C` once correlates the two halves of the union, which is
 * the whole point of making `Warning` discriminated.
 */
function textFor<C extends WarningCode>(
  code: C,
  context: WarningContext<C>,
): string {
  const { text } = WARNING_COPY[code];
  return typeof text === "function" ? text(context) : text;
}

/** The recipe-scoped sentences, in the order the engine raised them. */
export function recipeWarningTexts(warnings: readonly Warning[]): string[] {
  return warnings
    .filter((warning) => WARNING_COPY[warning.code].scope === "recipe")
    .map((warning) => warningText(warning));
}

/**
 * The row-scoped sentence for one dose row, if the engine raised one.
 *
 * At most one can apply: a row covered by the base water doses zero drops, so
 * it cannot also be over the drop ceiling. The row's note band shows exactly one
 * note (`format.ts` § rowNoteKind), and that is what makes returning a single
 * string honest rather than a silent truncation of a list.
 */
export function rowWarningText(
  warnings: readonly Warning[],
  concentrateId: string,
): string | undefined {
  const warning = warnings.find(
    (candidate) =>
      WARNING_COPY[candidate.code].scope === "row" &&
      // Structural, not a cast: only the row-scoped variants carry a
      // `concentrate_id`, so the `in` check is what narrows the union here.
      "concentrate_id" in candidate.context &&
      candidate.context.concentrate_id === concentrateId,
  );
  return warning === undefined ? undefined : warningText(warning);
}
