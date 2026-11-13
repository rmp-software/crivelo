import { describe, expect, it } from "vitest";
import { countMissing } from "../missing";

describe("countMissing", () => {
  it("counts the concentrates a recipe needs and the shelf lacks", () => {
    // The screen's acceptance case: 1 of 3 owned reads "faltam 2".
    expect(countMissing(["mg-30k", "ca-30k", "khco3-30k"], ["mg-30k"])).toBe(2);
  });

  it("is zero when every concentrate is owned", () => {
    expect(
      countMissing(["mg-30k", "ca-30k"], ["ca-30k", "mg-30k", "nahco3-30k"]),
    ).toBe(0);
  });

  it("counts every concentrate on a fresh device", () => {
    // Also guards the Set being built from the wrong argument: swap the two
    // and this returns 0.
    expect(countMissing(["mg-30k", "ca-30k"], [])).toBe(2);
  });
});
