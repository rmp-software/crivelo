/**
 * Unit tests for the offline half's locale convention.
 *
 * Both entry points (`createServiceWorker` in `sw.ts`, `createCriveloSerwistRoute`
 * in `serwist.ts`) are locale-shaped by construction, and the convention they
 * share — **an empty `locales` array means the app's routes are unprefixed** —
 * is one the type cannot express. These tests are where it is enforced.
 *
 * They cover the pure entry-building functions directly (both `@internal`-
 * exported for this purpose) rather than through the entry points: the public
 * calls construct a live `Serwist` instance in worker scope and compile the SW
 * with esbuild respectively, neither of which is a unit test.
 *
 * The non-empty cases are a **regression guard for apps/crivelo-web**, which is
 * live on `locales: ["en", "pt"]` and must come out byte-identical.
 */
import { describe, expect, it } from "vitest";
import type { HandlerDidErrorCallbackParam, PrecacheFallbackEntry } from "serwist";
import { offlineFallbackEntries } from "./sw";
import { offlinePrecacheEntries } from "./serwist";

/**
 * A minimal stand-in for Serwist's error-callback param. The matchers read only
 * `request.destination` and `request.url`, so a two-field object is the honest
 * fixture — building a real `Request` would need a fetch-capable environment and
 * still could not set `destination`, which is read-only and always `""` outside a
 * real navigation.
 */
function param(url: string, destination = "document"): HandlerDidErrorCallbackParam {
  return { request: { destination, url } } as unknown as HandlerDidErrorCallbackParam;
}

/** Which fallback entry (if any) claims a document request for `path`. */
function matchedUrl(entries: PrecacheFallbackEntry[], path: string, destination = "document") {
  const hit = entries.filter((entry) => entry.matcher?.(param(`https://app.test${path}`, destination)));
  // More than one match means the entries compete and the winner depends on
  // Serwist's iteration order — a latent bug, so assert it never happens.
  expect(hit.length).toBeLessThanOrEqual(1);
  return hit[0]?.url;
}

describe("offlineFallbackEntries — unprefixed app (locales: [])", () => {
  const entries = offlineFallbackEntries([], "/offline");

  it("registers exactly one fallback, at offlinePath verbatim", () => {
    expect(entries).toHaveLength(1);
    expect(entries[0]!.url).toBe("/offline");
  });

  it("catches a document request to a never-visited path", () => {
    expect(matchedUrl(entries, "/never-visited")).toBe("/offline");
  });

  it("catches the root and every in-app path, with no locale test", () => {
    for (const path of ["/", "/receitas", "/receitas/padrao", "/enterprise", "/ptsd"]) {
      expect(matchedUrl(entries, path)).toBe("/offline");
    }
  });

  it("ignores non-document requests (only navigations fall back)", () => {
    expect(matchedUrl(entries, "/receitas", "image")).toBeUndefined();
  });
});

describe("offlineFallbackEntries — localized app (crivelo-web regression guard)", () => {
  const entries = offlineFallbackEntries(["en", "pt"], "/offline");

  it("registers one entry per locale plus the default-locale catch-all", () => {
    expect(entries.map((entry) => entry.url)).toEqual(["/en/offline", "/pt/offline", "/en"]);
  });

  it("routes a locale-prefixed path to that locale's offline page", () => {
    expect(matchedUrl(entries, "/en")).toBe("/en/offline");
    expect(matchedUrl(entries, "/en/never-visited")).toBe("/en/offline");
    expect(matchedUrl(entries, "/pt/receitas")).toBe("/pt/offline");
  });

  it("routes an unlocalized document request to the default-locale shell", () => {
    expect(matchedUrl(entries, "/")).toBe("/en");
  });

  it("bounds the locale prefix: /enterprise is not 'en', /ptsd is not 'pt'", () => {
    // A bare startsWith would claim both for a locale and serve that locale's
    // offline page; they must fall through to the catch-all shell instead.
    expect(matchedUrl(entries, "/enterprise")).toBe("/en");
    expect(matchedUrl(entries, "/ptsd")).toBe("/en");
  });

  it("ignores non-document requests", () => {
    expect(matchedUrl(entries, "/en/receitas", "image")).toBeUndefined();
  });
});

describe("offlinePrecacheEntries", () => {
  it("precaches the root shell and the offline page for an unprefixed app", () => {
    expect(offlinePrecacheEntries([], "/offline", "r1")).toEqual([
      { url: "/", revision: "r1" },
      { url: "/offline", revision: "r1" },
    ]);
  });

  it("precaches a shell + offline page per locale (crivelo-web regression guard)", () => {
    expect(offlinePrecacheEntries(["en", "pt"], "/offline", "r1")).toEqual([
      { url: "/en", revision: "r1" },
      { url: "/en/offline", revision: "r1" },
      { url: "/pt", revision: "r1" },
      { url: "/pt/offline", revision: "r1" },
    ]);
  });
});
