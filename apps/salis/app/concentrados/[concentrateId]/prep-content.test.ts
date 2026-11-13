import { describe, expect, it } from "vitest";
import { content } from "../../content";
import {
  formatBrDate,
  formatGrams,
  formatWhole,
  parseFormula,
  parseSteps,
} from "./prep-content";

describe("parseFormula", () => {
  it("subscripts the digits after an element symbol", () => {
    expect(parseFormula("KHCO3")).toEqual([
      { kind: "text", text: "KHCO" },
      { kind: "sub", text: "3" },
    ]);
  });

  it("keeps a hydrate coefficient on the baseline", () => {
    // The 7 of ·7H2O is how many water molecules, not a subscript. Getting this
    // wrong renders MgSO₄·₇H₂O.
    expect(parseFormula("MgSO4·7H2O")).toEqual([
      { kind: "text", text: "MgSO" },
      { kind: "sub", text: "4" },
      { kind: "dot" },
      { kind: "text", text: "7" },
      { kind: "text", text: "H" },
      { kind: "sub", text: "2" },
      { kind: "text", text: "O" },
    ]);
  });

  it("emits no subscript token for a formula without digits", () => {
    expect(parseFormula("NaCl").every((token) => token.kind === "text")).toBe(
      true,
    );
  });

  it("round-trips every mineral's formula in content", () => {
    for (const mineral of content.minerals) {
      const text = parseFormula(mineral.formula)
        .map((token) => (token.kind === "dot" ? "·" : token.text))
        .join("");
      expect(text).toBe(mineral.formula);
    }
  });
});

describe("parseSteps", () => {
  it("strips the ordinal Juliana types, so the <ol> does not double it", () => {
    expect(parseSteps("1. Pese o sal.\n2. Dissolva em 180 mL.")).toEqual([
      "Pese o sal.",
      "Dissolva em 180 mL.",
    ]);
  });

  it("accepts unnumbered lines and the ) form", () => {
    expect(parseSteps("Pese o sal.\n2) Dissolva.")).toEqual([
      "Pese o sal.",
      "Dissolva.",
    ]);
  });

  it("drops blank lines and trailing whitespace", () => {
    expect(parseSteps("  1. Pese.  \n\n\n3. Rotule.\n")).toEqual([
      "Pese.",
      "Rotule.",
    ]);
  });

  it("never swallows a digit that belongs to the step", () => {
    expect(parseSteps("1. Dissolva em 180 mL de água.")).toEqual([
      "Dissolva em 180 mL de água.",
    ]);
  });

  it("yields at least one step for every concentrate in content", () => {
    for (const concentrate of content.concentrates) {
      expect(parseSteps(concentrate.steps_pt).length).toBeGreaterThan(0);
    }
  });
});

describe("formatBrDate", () => {
  it("reorders an ISO date without touching a timezone", () => {
    // The bug this guards: `new Date("2026-11-12")` is UTC midnight, which is
    // 11/11 in Brazil — a prep date one day before the one on the bottle.
    expect(formatBrDate("2026-11-12")).toBe("12/11/2026");
    expect(formatBrDate("2026-01-01")).toBe("01/01/2026");
  });

  it("passes an unexpected shape through instead of printing undefined", () => {
    expect(formatBrDate("ontem")).toBe("ontem");
  });
});

describe("pt-BR numbers", () => {
  it("uses a comma for the decimal and a dot for the thousands", () => {
    expect(formatGrams(12.3)).toBe("12,3");
    expect(formatGrams(76.1)).toBe("76,1");
    expect(formatWhole(250)).toBe("250");
    expect(formatWhole(1000)).toBe("1.000");
  });
});
