import { describe, expect, it } from "vitest";
import { content } from "../content";
import { shelfLife } from "./shelf-life";

describe("shelfLife", () => {
  it("expires the prep date plus the concentrate's shelf life", () => {
    expect(shelfLife("2026-10-15", 90, "2026-10-20")).toEqual({
      expiresOn: "2027-01-13",
      expired: false,
    });
  });

  it("counts whole days across a month, a year and a leap day", () => {
    expect(shelfLife("2026-12-01", 90, "2026-12-01")?.expiresOn).toBe(
      "2027-03-01",
    );
    expect(shelfLife("2024-02-28", 2, "2024-02-28")?.expiresOn).toBe(
      "2024-03-01",
    );
  });

  it("is still fresh ON the expiry day and old the day after", () => {
    // The off-by-one that decides whether a 90-day bottle gets 90 days or 89.
    expect(shelfLife("2026-10-15", 90, "2027-01-13")?.expired).toBe(false);
    expect(shelfLife("2026-10-15", 90, "2027-01-14")?.expired).toBe(true);
  });

  it("does not expire a bottle early because UTC is already tomorrow", () => {
    // `today` is the LOCAL calendar day (see todayIso). A bottle good through
    // 13/01 must read fresh all of 13/01 in Brazil, including the hours when
    // UTC has rolled over to the 14th.
    expect(shelfLife("2026-10-15", 90, "2027-01-13")?.expired).toBe(false);
  });

  it("answers nothing for a concentrate owned with no prep date", () => {
    // S0 seeds an inventory without dates, so this is a real state, not a bug.
    expect(shelfLife(undefined, 90, "2026-11-13")).toBeNull();
  });

  it("answers nothing for a date the store would never have written", () => {
    expect(shelfLife("ontem", 90, "2026-11-13")).toBeNull();
    // Matches YYYY-MM-DD and still is not a day — V8 rolls it to March 3.
    expect(shelfLife("2026-02-31", 90, "2026-11-13")).toBeNull();
    expect(shelfLife("2026-11-02T10:00:00Z", 90, "2026-11-13")).toBeNull();
  });

  it("holds for every concentrate Juliana ships", () => {
    // Guards the content as much as the function: a missing or non-numeric
    // shelf_life_days would silently drop the warning from a real bottle.
    for (const concentrate of content.concentrates) {
      const fresh = shelfLife(
        "2026-11-13",
        concentrate.shelf_life_days,
        "2026-11-13",
      );
      expect(fresh).not.toBeNull();
      expect(fresh?.expired).toBe(false);
      expect(
        shelfLife("2000-01-01", concentrate.shelf_life_days, "2026-11-13")
          ?.expired,
      ).toBe(true);
    }
  });

  it("answers nothing for a shelf life that is not a count of days", () => {
    // `docs/03-content-schema.md` types the column `int` and the importer only
    // checks "is a number", so each of these is a reachable spreadsheet value.
    // A negative one used to expire the bottle on the day it was prepared.
    expect(shelfLife("2026-11-13", 0, "2026-11-13")).toBeNull();
    expect(shelfLife("2026-11-13", -5, "2026-11-13")).toBeNull();
    expect(shelfLife("2026-11-13", 90.5, "2026-11-13")).toBeNull();
    expect(shelfLife("2026-11-13", Number.NaN, "2026-11-13")).toBeNull();
    expect(
      shelfLife("2026-11-13", Number.POSITIVE_INFINITY, "2026-11-13"),
    ).toBeNull();
  });

  it("reads the device clock when no day is given", () => {
    // The default argument is the only impure line in the module; this is the
    // one case that exercises it.
    expect(shelfLife("2000-01-01", 90)?.expired).toBe(true);
  });
});
