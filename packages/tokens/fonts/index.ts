import localFont from "next/font/local";

/**
 * @crivelo/tokens — the four foundation typefaces, loaded via next/font/local.
 * Consumed by an app's root layout: spread `fontVariables` onto <body> so the
 * --font-* CSS variables (referenced by styles/foundation.css) resolve.
 *
 * next/font/local must be statically analyzable, so these live in a module that
 * the consuming app transpiles (add "@crivelo/tokens" to next.config transpilePackages).
 */
export const bricolageGrotesque = localFont({
  src: "./BricolageGrotesque-VariableFont_opsz_wdth_wght.ttf",
  variable: "--font-display",
  display: "swap",
});

export const instrumentSerif = localFont({
  src: [
    { path: "./InstrumentSerif-Regular.ttf", weight: "400", style: "normal" },
    { path: "./InstrumentSerif-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const geistSans = localFont({
  src: "./Geist-VariableFont_wght.ttf",
  variable: "--font-body",
  display: "swap",
});

export const geistMono = localFont({
  src: "./GeistMono-VariableFont_wght.ttf",
  variable: "--font-mono",
  display: "swap",
});

/** Space-joined CSS variable classNames for all four families. */
export const fontVariables = [
  bricolageGrotesque.variable,
  instrumentSerif.variable,
  geistSans.variable,
  geistMono.variable,
].join(" ");
