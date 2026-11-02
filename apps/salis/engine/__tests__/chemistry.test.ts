import { describe, expect, it } from "vitest";
import {
  FormulaError,
  ionAsCaCO3Factor,
  ionFractions,
  ionMassFraction,
  ionMultiplicity,
  molarMass,
  parseFormula,
} from "../chemistry.ts";

/**
 * The six salts Juliana's course uses. Expected molar masses are computed from
 * IUPAC conventional atomic weights; the point of asserting them is that the
 * HYDRATE is in the denominator — the anhydrous figure for any of these would
 * be a dosing error of up to 2×.
 */
describe("the six course salts", () => {
  const cases = [
    { formula: "MgSO4·7H2O", mass: 246.466, ion: "Mg", fraction: 0.0986 },
    { formula: "CaCl2·2H2O", mass: 147.008, ion: "Ca", fraction: 0.2726 },
    { formula: "KHCO3", mass: 100.114, ion: "HCO3", fraction: 0.6095 },
    { formula: "NaHCO3", mass: 84.006, ion: "HCO3", fraction: 0.7263 },
    { formula: "CaSO4·2H2O", mass: 172.164, ion: "Ca", fraction: 0.2328 },
    { formula: "MgCl2·6H2O", mass: 203.295, ion: "Mg", fraction: 0.1196 },
  ] as const;

  for (const { formula, mass, ion, fraction } of cases) {
    it(`${formula} → molar mass ${mass}`, () => {
      expect(molarMass(formula)).toBeCloseTo(mass, 2);
    });

    it(`${formula} → ${ion} mass fraction ${fraction}`, () => {
      expect(ionMassFraction(formula, ion)).toBeCloseTo(fraction, 4);
    });
  }
});

describe("hydrates are not anhydrous", () => {
  it("counts water of crystallisation in the denominator", () => {
    // The exact trap this module exists to prevent: the design handoff hard-codes
    // 0.2019 (anhydrous MgSO4) for a heptahydrate concentrate — a 2.05× error.
    expect(ionMassFraction("MgSO4", "Mg")).toBeCloseTo(0.2019, 4);
    expect(ionMassFraction("MgSO4·7H2O", "Mg")).toBeCloseTo(0.0986, 4);

    const ratio = ionMassFraction("MgSO4", "Mg") / ionMassFraction("MgSO4·7H2O", "Mg");
    expect(ratio).toBeCloseTo(2.048, 2);
  });

  it("parses the hydrate coefficient as a multiplier on the whole segment", () => {
    const counts = parseFormula("MgSO4·7H2O");
    expect(counts).toEqual({ Mg: 1, S: 1, O: 11, H: 14 }); // 4 + 7 oxygens
  });

  it("accepts the separators a spreadsheet may emit", () => {
    const viaDot = molarMass("CaCl2·2H2O");
    expect(molarMass("CaCl2*2H2O")).toBeCloseTo(viaDot, 6);
    expect(molarMass("CaCl2.2H2O")).toBeCloseTo(viaDot, 6);
  });
});

describe("parser", () => {
  it("reads multi-letter symbols and subscripts", () => {
    expect(parseFormula("NaHCO3")).toEqual({ Na: 1, H: 1, C: 1, O: 3 });
  });

  it("reads parenthesised groups with a multiplier", () => {
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it("rejects an unknown element rather than silently weighing it zero", () => {
    expect(() => molarMass("XyCl2")).toThrow(FormulaError);
    expect(() => molarMass("XyCl2")).toThrow(/unknown element "Xy"/);
  });

  it("rejects malformed input", () => {
    expect(() => parseFormula("")).toThrow(FormulaError);
    expect(() => parseFormula("2")).toThrow(FormulaError);
    expect(() => parseFormula("Ca(OH2")).toThrow(/unbalanced/);
    expect(() => parseFormula("ca")).toThrow(/unexpected character "c"/);
  });
});

describe("ion multiplicity", () => {
  it("counts a monatomic ion by its own element", () => {
    expect(ionMultiplicity("CaCl2·2H2O", "Cl")).toBe(2);
    expect(ionMultiplicity("CaCl2·2H2O", "Ca")).toBe(1);
  });

  it("counts a polyatomic ion by its signature element, not by H or O", () => {
    // H and O both appear in the water of hydration, so they identify nothing.
    expect(ionMultiplicity("KHCO3", "HCO3")).toBe(1);
    expect(ionMultiplicity("MgSO4·7H2O", "SO4")).toBe(1);
  });

  it("returns 0 for an ion the salt does not contain", () => {
    expect(ionMultiplicity("KHCO3", "Ca")).toBe(0);
    expect(ionMassFraction("KHCO3", "Ca")).toBe(0);
  });
});

describe("spectator ions", () => {
  it("reports every ion a salt carries, not just the targeted one", () => {
    // Dosing KHCO3 for its bicarbonate also puts potassium in the cup.
    const fractions = ionFractions("KHCO3");
    expect(Object.keys(fractions).sort()).toEqual(["HCO3", "K"]);
    expect(fractions.K).toBeCloseTo(0.3905, 4);
    expect(fractions.HCO3).toBeCloseTo(0.6095, 4);
    // The two ions account for the entire salt.
    expect(fractions.K! + fractions.HCO3!).toBeCloseTo(1, 6);
  });

  it("splits a hydrate between its ions and its water", () => {
    const fractions = ionFractions("CaCl2·2H2O");
    expect(fractions.Ca).toBeCloseTo(0.2726, 4);
    expect(fractions.Cl).toBeCloseTo(0.4823, 4);
    // The remainder is water of crystallisation — 2 × 18.015 / 147.008.
    expect(1 - fractions.Ca! - fractions.Cl!).toBeCloseTo(0.2451, 4);
  });
});

describe("as CaCO3 factors", () => {
  it("matches the values in docs/01 § Calculation rules", () => {
    expect(ionAsCaCO3Factor("Ca")).toBe(2.497);
    expect(ionAsCaCO3Factor("Mg")).toBe(4.118);
    expect(ionAsCaCO3Factor("HCO3")).toBe(0.82);
  });

  it("gives non-contributors a factor of zero", () => {
    expect(ionAsCaCO3Factor("Na")).toBe(0);
    expect(ionAsCaCO3Factor("Cl")).toBe(0);
    expect(ionAsCaCO3Factor("SO4")).toBe(0);
  });
});
