import localFont from "next/font/local";

/**
 * @salis/tokens — the two Salis typefaces, loaded via next/font/local.
 * Consumed by apps/salis's root layout: spread `fontVariables` onto <body> so
 * the --font-* CSS variables (referenced by styles/foundation.css) resolve.
 *
 * next/font/local must be statically analyzable, so these live in a module the
 * consuming app transpiles (add "@salis/tokens" to next.config transpilePackages).
 *
 * The `variable` names are `--font-body` / `--font-mono` ON PURPOSE — the same
 * names the foundation declares with literal family stacks. next/font emits its
 * hashed family (plus a metric-matched fallback) into those variables on <body>,
 * shadowing the :root literals for everything inside; the literals remain as the
 * fallback for anything rendered outside <body>. Same arrangement as
 * @crivelo/tokens.
 *
 * SUBSET NOTE: the design handoff ships each face as two woff2 subsets (latin +
 * latin-ext) with per-face `unicode-range`. next/font/local has no per-src
 * unicode-range, so only the **latin** subsets are loaded here. That is complete
 * for Brazilian Portuguese — every pt-BR diacritic (á â ã à ç é ê í ó ô õ ú ü)
 * lives in Latin-1 Supplement, inside the latin subset's range. Chemistry is
 * likewise safe: formulas render real subscripts via <sub> elements (NOT the
 * U+2080 Unicode subscript block), and `·` / `²` are in-range. The one glyph
 * that falls through to a system font is the superscript plus in charge notation
 * ("Mg²⁺", U+207A). If that becomes visible, add the latin-ext files back with a
 * hand-written @font-face block rather than reaching for next/font.
 *
 * Source Sans 3 is a VARIABLE font — one file covers 400–700, which is why the
 * handoff's fonts.css points weights 400/500/600/700 at the same woff2. IBM Plex
 * Mono ships three real static weights.
 */

/** Source Sans 3 — prose and UI. Variable 400–700 + a true italic. */
export const sourceSans3 = localFont({
  src: [
    { path: "./SourceSans3-400-latin.woff2", weight: "400 700", style: "normal" },
    { path: "./SourceSans3-400i-latin.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});

/**
 * IBM Plex Mono — every quantity on screen. Tabular figures and the slashed zero
 * come from `--font-mono-features` in the foundation, not from here.
 */
export const ibmPlexMono = localFont({
  src: [
    { path: "./IBMPlexMono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./IBMPlexMono-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./IBMPlexMono-600-latin.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Space-joined CSS variable classNames for both families. Spread onto <body>.
 * Salis has no display or serif face, so `--font-display` keeps the foundation's
 * value (the sans stack) and needs no entry here.
 */
export const fontVariables = [sourceSans3.variable, ibmPlexMono.variable].join(" ");
