/**
 * Chemistry: parse a mineral's full formula into a molar mass and ion mass
 * fractions.
 *
 * This module exists so that NO ion fraction is ever typed by hand. Hydrate
 * forms change a dose by up to 2× (MgSO4 is 20.2% Mg; MgSO4·7H2O is 9.9%), and
 * typing the anhydrous figure for a heptahydrate concentrate is the single
 * easiest way to make every drop count in the app wrong. Juliana authors the
 * formula; everything numeric is derived from it.
 *
 * Pure: no DOM, no I/O, no dependencies.
 */

/**
 * Standard atomic weights (IUPAC 2021, conventional values). Only the elements
 * reachable from the salts Juliana teaches plus citrate — an unknown element is
 * an error, never a silent zero, because a silent zero would yield a plausible
 * molar mass and a wrong dose.
 */
const ATOMIC_MASS: Readonly<Record<string, number>> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
};

/** Element counts of a parsed formula, e.g. { Mg: 1, S: 1, O: 11, H: 14 }. */
export type ElementCounts = Readonly<Record<string, number>>;

/** The ions the app reports. `citrate` is a possible counter-ion, not a target. */
export const ION_KEYS = [
  "Ca",
  "Mg",
  "Na",
  "K",
  "HCO3",
  "Cl",
  "SO4",
  "citrate",
] as const;

export type IonKey = (typeof ION_KEYS)[number];

/**
 * How to recognise and weigh each ion inside a salt.
 *
 * `key` + `perUnit` answer "how many of this ion does one formula unit carry?"
 * without needing a real structural parse: count the ion's signature element in
 * the salt and divide. Cl in CaCl2 → 2 chlorides; C in KHCO3 → 1 bicarbonate;
 * C in a citrate (C6H5O7) → 6 carbons per citrate, hence perUnit 6.
 *
 * The signature element is deliberately NOT H or O, which appear in water of
 * hydration and in several ions at once and so identify nothing.
 */
const ION_SPEC: Readonly<Record<IonKey, { formula: string; key: string; perUnit: number }>> = {
  Ca: { formula: "Ca", key: "Ca", perUnit: 1 },
  Mg: { formula: "Mg", key: "Mg", perUnit: 1 },
  Na: { formula: "Na", key: "Na", perUnit: 1 },
  K: { formula: "K", key: "K", perUnit: 1 },
  HCO3: { formula: "HCO3", key: "C", perUnit: 1 },
  Cl: { formula: "Cl", key: "Cl", perUnit: 1 },
  SO4: { formula: "SO4", key: "S", perUnit: 1 },
  citrate: { formula: "C6H5O7", key: "C", perUnit: 6 },
};

/**
 * Conversion factors to "as CaCO3" (the unit on test strips and every SCA
 * chart). Everything else contributes nothing to hardness or alkalinity.
 * See docs/01 § Calculation rules.
 */
const AS_CACO3: Readonly<Partial<Record<IonKey, number>>> = {
  Ca: 2.497,
  Mg: 4.118,
  HCO3: 0.82,
};

export class FormulaError extends Error {
  constructor(formula: string, detail: string) {
    super(`Cannot parse formula "${formula}": ${detail}`);
    this.name = "FormulaError";
  }
}

/**
 * Parse a chemical formula into element counts.
 *
 * Supports element symbols with subscripts (`CaCl2`), parenthesised groups with
 * multipliers (`Ca(OH)2`), and hydrate segments separated by `·` with a leading
 * coefficient (`MgSO4·7H2O`). A middle dot, an ASCII asterisk and a full stop
 * are all accepted as the hydrate separator, because spreadsheets mangle `·`.
 */
export function parseFormula(formula: string): ElementCounts {
  const trimmed = formula.trim();
  if (!trimmed) throw new FormulaError(formula, "empty");

  const counts: Record<string, number> = {};

  // Hydrate segments: "MgSO4·7H2O" → ["MgSO4", "7H2O"].
  for (const rawSegment of trimmed.split(/[·*.]/)) {
    const segment = rawSegment.trim();
    if (!segment) throw new FormulaError(formula, "empty hydrate segment");

    // A leading integer multiplies the whole segment (the 7 in 7H2O).
    const lead = /^(\d+)/.exec(segment);
    const coefficient = lead ? Number(lead[1]) : 1;
    if (coefficient === 0) throw new FormulaError(formula, "zero hydrate coefficient");

    parseGroup(formula, segment.slice(lead ? lead[1].length : 0), coefficient, counts);
  }

  if (Object.keys(counts).length === 0) throw new FormulaError(formula, "no elements found");
  return counts;
}

/** Parse one parenthesis-free-or-nested run of elements, scaled by `multiplier`. */
function parseGroup(
  formula: string,
  source: string,
  multiplier: number,
  counts: Record<string, number>
): void {
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (char === "(") {
      const close = findMatchingParen(formula, source, i);
      const inner = source.slice(i + 1, close);
      i = close + 1;
      const [groupCount, next] = readCount(source, i);
      i = next;
      parseGroup(formula, inner, multiplier * groupCount, counts);
      continue;
    }

    if (!/[A-Z]/.test(char)) {
      throw new FormulaError(formula, `unexpected character "${char}"`);
    }

    // An element symbol is an uppercase letter plus any lowercase letters.
    let symbol = char;
    i += 1;
    while (i < source.length && /[a-z]/.test(source[i])) {
      symbol += source[i];
      i += 1;
    }

    if (!(symbol in ATOMIC_MASS)) {
      throw new FormulaError(formula, `unknown element "${symbol}"`);
    }

    const [count, next] = readCount(source, i);
    i = next;
    counts[symbol] = (counts[symbol] ?? 0) + count * multiplier;
  }
}

function findMatchingParen(formula: string, source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "(") depth += 1;
    else if (source[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new FormulaError(formula, "unbalanced parentheses");
}

/** Read an optional integer subscript at `i`; absent means 1. */
function readCount(source: string, i: number): [count: number, next: number] {
  const match = /^(\d+)/.exec(source.slice(i));
  if (!match) return [1, i];
  return [Number(match[1]), i + match[1].length];
}

/** Molar mass in g/mol of a parsed or literal formula. */
export function molarMass(formula: string | ElementCounts): number {
  const counts = typeof formula === "string" ? parseFormula(formula) : formula;
  let total = 0;
  for (const [symbol, count] of Object.entries(counts)) {
    total += ATOMIC_MASS[symbol] * count;
  }
  return total;
}

/**
 * How many units of `ion` one formula unit of the salt carries. Returns 0 when
 * the salt does not contain the ion.
 *
 * Counting the signature element alone is not enough: HCO3 and citrate are both
 * keyed on carbon, so KHCO3's single C would otherwise read as 1/6 of a citrate.
 * Two further conditions settle it without a structural parse —
 *
 *   1. the multiplicity must be a positive INTEGER (1/6 of an ion is nonsense), and
 *   2. the ion's own atoms must FIT inside the salt at that multiplicity.
 *
 * Together these discriminate in both directions: citrate is rejected from
 * KHCO3 by rule 1, and HCO3 is rejected from a citrate salt (Na3C6H5O7, whose
 * 6 carbons would demand 6 bicarbonates and so 18 oxygens) by rule 2.
 */
export function ionMultiplicity(formula: string | ElementCounts, ion: IonKey): number {
  const counts = typeof formula === "string" ? parseFormula(formula) : formula;
  const spec = ION_SPEC[ion];
  const signature = counts[spec.key] ?? 0;
  if (signature === 0) return 0;

  const units = signature / spec.perUnit;
  if (!Number.isInteger(units) || units <= 0) return 0;

  const ionCounts = parseFormula(spec.formula);
  for (const [symbol, perUnitCount] of Object.entries(ionCounts)) {
    if ((counts[symbol] ?? 0) < perUnitCount * units) return 0;
  }

  return units;
}

/**
 * Mass fraction of `ion` in the salt — mg of ion per mg of salt, **as weighed**
 * (so a hydrate's water of crystallisation is part of the denominator, which is
 * the whole point).
 *
 * Returns 0 when the salt does not carry the ion.
 */
export function ionMassFraction(formula: string | ElementCounts, ion: IonKey): number {
  const counts = typeof formula === "string" ? parseFormula(formula) : formula;
  const units = ionMultiplicity(counts, ion);
  if (units === 0) return 0;
  return (molarMass(ION_SPEC[ion].formula) * units) / molarMass(counts);
}

/**
 * Mass fractions of every reported ion present in the salt. Used to work out
 * the spectator ions a concentrate drags along — dosing KHCO3 for its
 * bicarbonate also puts potassium in the cup, and the ion sheet must say so.
 */
export function ionFractions(formula: string | ElementCounts): Partial<Record<IonKey, number>> {
  const counts = typeof formula === "string" ? parseFormula(formula) : formula;
  const out: Partial<Record<IonKey, number>> = {};
  for (const ion of ION_KEYS) {
    const fraction = ionMassFraction(counts, ion);
    if (fraction > 0) out[ion] = fraction;
  }
  return out;
}

/** Factor converting mg/L of this ion into ppm as CaCO3. 0 for non-contributors. */
export function ionAsCaCO3Factor(ion: IonKey): number {
  return AS_CACO3[ion] ?? 0;
}

/** True when the symbol is an element this module knows how to weigh. */
export function isKnownElement(symbol: string): boolean {
  return symbol in ATOMIC_MASS;
}
