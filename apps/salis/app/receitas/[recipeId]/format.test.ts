import { describe, expect, it } from "vitest";
import {
  WATER_MAX_ML,
  WATER_MIN_ML,
  clampWaterMl,
  dropsUnit,
  formatMgPerL,
  formatMl,
  formatWhole,
  rowNoteKind,
  splitQuantities,
  stepWaterMl,
} from "./format";

describe("formatWhole", () => {
  it("groups thousands the pt-BR way", () => {
    expect(formatWhole(1000)).toBe("1.000");
    expect(formatWhole(500)).toBe("500");
    expect(formatWhole(12)).toBe("12");
  });
});

describe("formatMl", () => {
  it("keeps two decimals under 10 mL, where a drop is 0,05 mL", () => {
    expect(formatMl(0.6)).toBe("0,60");
    expect(formatMl(0.0267)).toBe("0,03");
    expect(formatMl(4.0103)).toBe("4,01");
  });

  it("drops to one decimal from 10 mL up", () => {
    expect(formatMl(12.54)).toBe("12,5");
    expect(formatMl(100)).toBe("100,0");
  });
});

describe("dropsUnit", () => {
  it("agrees the noun with the count", () => {
    expect(dropsUnit(1)).toBe("gota");
    expect(dropsUnit(0)).toBe("gotas");
    expect(dropsUnit(40)).toBe("gotas");
  });
});

describe("clampWaterMl", () => {
  it("holds the volume inside the stepper's range", () => {
    expect(clampWaterMl(50)).toBe(WATER_MIN_ML);
    expect(clampWaterMl(20000)).toBe(WATER_MAX_ML);
    expect(clampWaterMl(1000)).toBe(1000);
  });
});

describe("stepWaterMl", () => {
  it("moves one 100 mL step", () => {
    expect(stepWaterMl(1000, 1)).toBe(1100);
    expect(stepWaterMl(1000, -1)).toBe(900);
  });

  it("snaps an off-grid volume onto the grid, and still moves", () => {
    expect(stepWaterMl(1050, 1)).toBe(1100);
    expect(stepWaterMl(1050, -1)).toBe(1000);
  });

  it("stops at the ends of the range", () => {
    expect(stepWaterMl(WATER_MIN_ML, -1)).toBe(WATER_MIN_ML);
    expect(stepWaterMl(WATER_MAX_ML, 1)).toBe(WATER_MAX_ML);
  });
});

describe("formatMgPerL", () => {
  it("shows at most one decimal", () => {
    expect(formatMgPerL(8)).toBe("8");
    expect(formatMgPerL(71.1379)).toBe("71,1");
  });
});

describe("rowNoteKind", () => {
  const nothing = {
    missing: false,
    coveredByBase: false,
    expired: false,
    highDropCount: false,
    hasPrepDate: false,
  };

  it("holds the band empty when the row has nothing to say", () => {
    expect(rowNoteKind(nothing)).toBe("none");
  });

  it("picks each note on its own", () => {
    expect(rowNoteKind({ ...nothing, missing: true })).toBe("missing");
    expect(rowNoteKind({ ...nothing, coveredByBase: true })).toBe(
      "covered-by-base",
    );
    expect(rowNoteKind({ ...nothing, expired: true })).toBe("expired");
    expect(rowNoteKind({ ...nothing, highDropCount: true })).toBe(
      "high-drop-count",
    );
    expect(rowNoteKind({ ...nothing, hasPrepDate: true })).toBe("prepared-on");
  });

  it("prefers the link out of a missing row to every other note", () => {
    expect(
      rowNoteKind({
        missing: true,
        coveredByBase: true,
        expired: true,
        highDropCount: true,
        hasPrepDate: true,
      }),
    ).toBe("missing");
  });

  it("says the dose is already in the water before it says it is old", () => {
    // Pins covered-by-base ABOVE expired — the one adjacent pair in the
    // documented order that no other case separates. Swap the two branches in
    // rowNoteKind and only this test turns red. The order is not cosmetic: a
    // covered dose is ZERO drops, so warning that a bottle the student will
    // not open has gone off is a warning about nothing.
    expect(
      rowNoteKind({
        ...nothing,
        coveredByBase: true,
        expired: true,
        hasPrepDate: true,
      }),
    ).toBe("covered-by-base");
  });

  it("shows the shelf-life warning over the high-drop hint", () => {
    expect(
      rowNoteKind({
        ...nothing,
        expired: true,
        highDropCount: true,
        hasPrepDate: true,
      }),
    ).toBe("expired");
  });

  it("keeps the prep date out of the way of every warning", () => {
    expect(rowNoteKind({ ...nothing, highDropCount: true, hasPrepDate: true })).toBe(
      "high-drop-count",
    );
  });
});

describe("splitQuantities", () => {
  // The invariant the renderer relies on: even indices are literals, odd
  // indices are the quantities it sets in mono.
  it("interleaves literals and quantities", () => {
    expect(splitQuantities("Mais de 60 gotas.")).toEqual([
      "Mais de ",
      "60",
      " gotas.",
    ]);
  });

  it("leaves a digit welded to a word alone", () => {
    // The regression this guard exists for: no word boundary meant "HCO3" came
    // back as ["HCO", "3", …] and rendered a mono 3 mid-formula. Dormant today
    // only because warnings.ts spells its ions out — a convention, not a fence.
    expect(splitQuantities("HCO3 já presente.")).toEqual(["HCO3 já presente."]);
    expect(splitQuantities("CaCO3")).toEqual(["CaCO3"]);
    // Accented letters are letters: `\w` would have split "ção2" here.
    expect(splitQuantities("solução2")).toEqual(["solução2"]);
  });

  it("keeps a pt-BR decimal in one run", () => {
    expect(splitQuantities("Meça 3,27 mL.")).toEqual(["Meça ", "3,27", " mL."]);
  });

  it("keeps a pt-BR thousands mark in one run", () => {
    expect(splitQuantities("1.000 mL")).toEqual(["", "1.000", " mL"]);
  });

  it("keeps thousands and decimal together in one run", () => {
    expect(splitQuantities("são 1.000,5 mL")).toEqual([
      "são ",
      "1.000,5",
      " mL",
    ]);
  });

  it("keeps a terminal period out of the quantity", () => {
    expect(splitQuantities("Mais de 60.")).toEqual(["Mais de ", "60", "."]);
  });

  it("holds the alternation across adjacent quantities", () => {
    expect(splitQuantities("de 60 a 3,27 mL")).toEqual([
      "de ",
      "60",
      " a ",
      "3,27",
      " mL",
    ]);
    expect(splitQuantities("20 30")).toEqual(["", "20", " ", "30", ""]);
  });

  it("returns the whole string when there is nothing to mark", () => {
    expect(splitQuantities("Alcalinidade baixa.")).toEqual([
      "Alcalinidade baixa.",
    ]);
    expect(splitQuantities("")).toEqual([""]);
  });
});
