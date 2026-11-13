/**
 * Pure helpers for S4 · Concentrado — the text and number shaping the screen
 * needs, kept out of the components so they are testable in the node
 * environment (`prep-content.test.ts`) without a renderer.
 *
 * Everything here reads Juliana's content as authored. Nothing derives
 * chemistry: the importer already did that (see `engine/types.ts`).
 */

/**
 * A chemistry formula split into what `<sub>` has to wrap.
 *
 * The handoff's `components/data/Formula.jsx` is the authority on the rendering
 * (real `<sub>` elements, never Unicode subscript characters), and this is its
 * parse step lifted out of the render. `dot` is the hydrate separator, which is
 * printed with its own spacing and a dimmer ink.
 */
export type FormulaToken =
  | { kind: "text"; text: string }
  | { kind: "sub"; text: string }
  | { kind: "dot" };

/**
 * Split a formula such as `MgSO4·7H2O` into tokens.
 *
 * The one rule that is not "digits are subscripts": the digits leading a
 * hydrate segment are a *coefficient* (the 7 in `·7H2O`), which sits on the
 * baseline. Everything after an element symbol or a closing paren is a
 * subscript.
 */
export function parseFormula(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];

  formula.split("·").forEach((segment, segmentIndex) => {
    if (segmentIndex > 0) tokens.push({ kind: "dot" });

    let rest = segment;
    const coefficient = /^(\d+)(.*)$/.exec(segment);
    if (coefficient) {
      tokens.push({ kind: "text", text: coefficient[1] });
      rest = coefficient[2];
    }

    // split() on a capturing group alternates non-digits and digits, so the odd
    // indices are exactly the digit runs.
    rest.split(/(\d+)/).forEach((part, index) => {
      if (part) tokens.push({ kind: index % 2 ? "sub" : "text", text: part });
    });
  });

  return tokens;
}

/**
 * A leading ordinal — `1.`, `2)`, `10 .` — at the start of a step.
 *
 * Juliana types her steps already numbered (`"1. Pese o sal…\n2. Dissolva…"`),
 * and the screen renders them in an `<ol>` with its own number badges. Stripping
 * the typed ordinal is what stops "1. 1. Pese o sal". It also means her sheet
 * works whether or not she numbers the lines.
 */
const LEADING_ORDINAL = /^\d+\s*[.)]\s*/;

/** The newline-separated `steps_pt` as the list the wireframe shows. */
export function parseSteps(stepsPt: string): string[] {
  return stepsPt
    .split("\n")
    .map((line) => line.trim().replace(LEADING_ORDINAL, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * `YYYY-MM-DD` → `DD/MM/YYYY`, by string surgery rather than `Date`.
 *
 * A date-only string parses as UTC midnight, so `new Date(iso).getDate()` in a
 * UTC-3 browser reports the day *before* the one the user wrote on the bottle.
 * There is no arithmetic to do here, only a reorder — so there is no reason to
 * involve a timezone. Anything that is not the expected shape is passed through
 * rather than printed as `undefined/undefined/NaN`.
 */
export function formatBrDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

/** pt-BR grams, as authored: `12.3` → `12,3`. */
const gramsFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

export function formatGrams(grams: number): string {
  return gramsFormat.format(grams);
}

/** pt-BR whole numbers, with her thousands separator: `1000` → `1.000`. */
const wholeFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export function formatWhole(value: number): string {
  return wholeFormat.format(value);
}
