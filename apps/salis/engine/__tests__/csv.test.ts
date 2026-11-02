import { describe, expect, it } from "vitest";
import {
  CsvError,
  parseBoolean,
  parseCsv,
  parseCsvRecords,
  parseDecimal,
  parseList,
} from "../csv.ts";

describe("parseCsv", () => {
  it("splits on the semicolon, because the comma is the decimal separator", () => {
    expect(parseCsv("a;b;c\n1;2;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("keeps a delimiter inside a quoted field", () => {
    expect(parseCsv('a;b\n"um; dois";3')).toEqual([
      ["a", "b"],
      ["um; dois", "3"],
    ]);
  });

  it("keeps newlines inside a quoted field", () => {
    // This is why the parser exists: steps_pt is newline-separated by design.
    const rows = parseCsv('id;steps\nkhco3;"1. Pese o sal.\n2. Dissolva."');
    expect(rows[1][1]).toBe("1. Pese o sal.\n2. Dissolva.");
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"diz ""olá"" aqui"')[1][0]).toBe('diz "olá" aqui');
  });

  it("handles CRLF and a lone CR", () => {
    expect(parseCsv("a;b\r\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv("a;b\r1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("strips the UTF-8 BOM Excel adds", () => {
    // Left in place the BOM becomes part of the first header and every lookup
    // for that column silently misses.
    const [header] = parseCsv("\uFEFFid;name\nx;y");
    expect(header[0]).toBe("id");
  });

  it("trims unquoted padding but preserves it inside quotes", () => {
    const rows = parseCsv('a;b\n  x  ;"  y  "');
    expect(rows[1]).toEqual(["x", "  y  "]);
  });

  it("drops blank rows but keeps a row of empty quoted fields", () => {
    expect(parseCsv("a;b\n1;2\n\n3;4")).toHaveLength(3);
  });

  it("reads a final line with no trailing newline", () => {
    expect(parseCsv("a;b\n1;2")).toHaveLength(2);
  });

  it("rejects an unterminated quote rather than truncating content", () => {
    expect(() => parseCsv('a\n"never closed')).toThrow(CsvError);
  });
});

describe("parseCsvRecords", () => {
  it("keys rows by the header", () => {
    expect(parseCsvRecords("id;name_pt\nkhco3;Bicarbonato")).toEqual([
      { id: "khco3", name_pt: "Bicarbonato" },
    ]);
  });

  it("fills missing trailing cells with empty strings", () => {
    expect(parseCsvRecords("a;b;c\n1;2")).toEqual([{ a: "1", b: "2", c: "" }]);
  });

  it("rejects duplicate columns instead of silently dropping one", () => {
    expect(() => parseCsvRecords("id;id\n1;2")).toThrow(/duplicate column/);
  });

  it("returns nothing for an empty file", () => {
    expect(parseCsvRecords("")).toEqual([]);
  });
});

describe("parseDecimal", () => {
  it("reads the Brazilian comma decimal", () => {
    expect(parseDecimal("2,45")).toBe(2.45);
    expect(parseDecimal("24,6")).toBe(24.6);
  });

  it("reads a dot decimal too", () => {
    expect(parseDecimal("2.45")).toBe(2.45);
  });

  it("reads a dotted thousands separator", () => {
    // Juliana writes concentrate strengths as "30.000 ppm".
    expect(parseDecimal("30.000")).toBe(30000);
    expect(parseDecimal("1.000")).toBe(1000);
  });

  it("reads both separators together", () => {
    expect(parseDecimal("30.000,5")).toBe(30000.5);
  });

  it("does not mistake a 2-decimal value for thousands", () => {
    expect(parseDecimal("3.00")).toBe(3);
    expect(parseDecimal("0.05")).toBe(0.05);
  });

  it("returns NaN for a blank, so the importer can require a value", () => {
    expect(parseDecimal("")).toBeNaN();
    expect(parseDecimal("   ")).toBeNaN();
  });
});

describe("parseBoolean", () => {
  it("reads either language", () => {
    expect(parseBoolean("sim")).toBe(true);
    expect(parseBoolean("TRUE")).toBe(true);
    expect(parseBoolean("x")).toBe(true);
    expect(parseBoolean("não")).toBe(false);
    expect(parseBoolean("nao")).toBe(false);
    expect(parseBoolean("")).toBe(false);
  });

  it("returns undefined for something it cannot read", () => {
    // Undefined, not false: the importer must reject "talvez", not assume no.
    expect(parseBoolean("talvez")).toBeUndefined();
  });
});

describe("parseList", () => {
  it("splits and trims, dropping empties", () => {
    expect(parseList("V60, Kalita, prensa")).toEqual(["V60", "Kalita", "prensa"]);
    expect(parseList("mg-30k,  ca-30k ,")).toEqual(["mg-30k", "ca-30k"]);
    expect(parseList("")).toEqual([]);
  });
});

describe("regressions — defects found in adversarial review", () => {
  it("does not read a 3-decimal-digit value as thousands", () => {
    // The heuristic used to match any dot-decimal whose fraction was exactly 3
    // digits, so "0.125" became 125 — a silent 1000× error, and exactly the
    // shape of a label value like "0.800 mg/L" copied from an English source.
    expect(parseDecimal("0.125")).toBe(0.125);
    expect(parseDecimal("0.420")).toBe(0.42);
    expect(parseDecimal("-0.125")).toBe(-0.125);
    expect(parseDecimal("0.800")).toBe(0.8);
  });

  it("still reads a genuine thousands separator", () => {
    // A thousands-grouped number never has a leading-zero integer part, which
    // is what separates these from the cases above.
    expect(parseDecimal("30.000")).toBe(30000);
    expect(parseDecimal("1.000")).toBe(1000);
    expect(parseDecimal("1.234.567")).toBe(1234567);
    expect(parseDecimal("-30.000")).toBe(-30000);
  });

  it("normalises CRLF inside a quoted field", () => {
    // steps_pt and body_md are deliberately multi-line, so a Windows/Excel
    // export carries CRLF inside the quotes. A stray \r survives any downstream
    // split on "\n" and renders as a blank artefact.
    const rows = parseCsv('id;steps\r\nkhco3;"1. Pese.\r\n2. Dissolva.\r\n3. Complete."\r\n');
    expect(rows[1][1]).toBe("1. Pese.\n2. Dissolva.\n3. Complete.");
    expect(rows[1][1]).not.toContain("\r");
  });

  it("normalises a lone CR inside a quoted field", () => {
    expect(parseCsv('a\n"um\rdois"')[1][0]).toBe("um\ndois");
  });
});
