import { describe, expect, it } from "vitest";
import { TABS, isRootTabPath } from "../tabs";

/**
 * `isRootTabPath` is the single decision behind "pushed screens hide the tab
 * bar" (RMP-251). The shell's rendering of it needs a browser; the rule itself
 * is pure, so it is tested here instead of behind a DOM.
 */
describe("isRootTabPath", () => {
  it("accepts every root tab", () => {
    for (const tab of TABS) {
      expect(isRootTabPath(tab.href)).toBe(true);
    }
  });

  it("rejects a pushed screen under a tab", () => {
    expect(isRootTabPath("/receitas/mais-doce")).toBe(false);
  });

  it("rejects a path that only starts like a tab", () => {
    expect(isRootTabPath("/receitas-antigas")).toBe(false);
  });

  it("rejects the root path, which only redirects to a tab", () => {
    expect(isRootTabPath("/")).toBe(false);
  });
});

describe("TABS", () => {
  it("holds the three course sections, in bar order", () => {
    expect(TABS.map((tab) => tab.label)).toEqual([
      "Receitas",
      "Concentrados",
      "Aprender",
    ]);
  });
});
