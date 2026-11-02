/**
 * A small RFC 4180 CSV reader for Juliana's exported spreadsheet tabs.
 *
 * Hand-rolled rather than pulled from npm, because the whole job is ~60 lines
 * and the kickoff asks before adding dependencies. It is NOT a naive
 * `split("\n").split(";")`: two of her columns make that unsafe —
 * `steps_pt` is newline-separated by design and `body_md` is markdown — so
 * quoted fields containing delimiters, newlines and escaped quotes all have to
 * survive intact.
 *
 * Brazilian-locale specifics the importer relies on:
 *   - the delimiter is `;`, because a comma is the decimal separator
 *   - numbers are written `2,45` and normalised by `parseDecimal`
 *   - files are UTF-8 and may carry a BOM, which Excel adds silently
 *
 * Pure: no I/O. The importer hands it a string.
 */

export class CsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvError";
  }
}

/** Parse a delimited string into rows of raw cell strings. */
export function parseCsv(input: string, delimiter = ";"): string[][] {
  // Excel writes a UTF-8 BOM; left in place it becomes part of the first header
  // name and every lookup for that column silently misses.
  const text = input.replace(/^\uFEFF/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;
  let i = 0;

  const endField = () => {
    // Only unquoted fields get trimmed: whitespace inside quotes is the
    // author's (markdown indentation, say), not spreadsheet padding.
    row.push(fieldWasQuoted ? field : field.trim());
    field = "";
    fieldWasQuoted = false;
  };

  const endRow = () => {
    endField();
    // Skip rows that are entirely empty — trailing newlines, blank spacer rows.
    if (row.some((cell) => cell !== "")) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // "" is an escaped quote
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      fieldWasQuoted = true;
      i += 1;
      continue;
    }

    if (char === delimiter) {
      endField();
      i += 1;
      continue;
    }

    if (char === "\r") {
      // Normalise CRLF and a lone CR to one row break.
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }

    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (inQuotes) throw new CsvError("unterminated quoted field");

  // Flush whatever the last line left behind (no trailing newline).
  if (field !== "" || row.length > 0) endRow();

  return rows;
}

/** A parsed sheet: header names plus row objects keyed by them. */
export type CsvRecord = Record<string, string>;

/**
 * Parse into records keyed by the header row. Duplicate headers are an error
 * rather than a silent last-wins, since that would quietly drop a column.
 */
export function parseCsvRecords(input: string, delimiter = ";"): CsvRecord[] {
  const rows = parseCsv(input, delimiter);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const seen = new Set<string>();
  for (const header of headers) {
    if (seen.has(header)) throw new CsvError(`duplicate column "${header}"`);
    seen.add(header);
  }

  return rows.slice(1).map((cells) => {
    const record: CsvRecord = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

/**
 * Read a Brazilian-locale decimal: `2,45` → 2.45. Also tolerates a plain
 * `2.45`, and thousands separators in the `30.000` form that Juliana uses for
 * concentrate strengths.
 */
export function parseDecimal(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") return Number.NaN;

  // "30.000,5" → "30000.5"; "30.000" → "30000"; "2,45" → "2.45"; "2.45" → "2.45".
  let normalised = trimmed;
  if (normalised.includes(",")) {
    normalised = normalised.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalised)) {
    // Dots only, and grouped in threes — a thousands separator, not a decimal point.
    normalised = normalised.replace(/\./g, "");
  }

  return Number(normalised);
}

/** Read a boolean the way a spreadsheet writes one, in either language. */
export function parseBoolean(value: string): boolean | undefined {
  const normalised = value.trim().toLowerCase();
  if (["true", "sim", "s", "yes", "y", "1", "x", "verdadeiro"].includes(normalised)) {
    return true;
  }
  if (["false", "não", "nao", "n", "no", "0", "", "falso"].includes(normalised)) {
    return false;
  }
  return undefined;
}

/** Split a `a, b, c` cell into a trimmed list, dropping empties. */
export function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}
