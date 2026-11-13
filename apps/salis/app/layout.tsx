import type { Metadata, Viewport } from "next";
import { fontVariables } from "@salis/tokens/fonts";
import { AppShell } from "./app-shell";
import "./globals.css";

/**
 * Salis root layout.
 *
 * `lang="pt-BR"` is fixed, not negotiated: Salis ships in Brazilian Portuguese
 * only (Juliana's students), so there is no i18n routing and no locale segment.
 * Code, comments and docs stay English — see apps/salis/CLAUDE.md.
 *
 * PWA wiring (manifest, icon tiles, iOS splash, Serwist offline) is NOT here
 * yet: it belongs to Phase 2 of the build order. See apps/salis/CLAUDE.md for
 * the one open question the @crivelo/pwa offline half raises for a
 * single-locale app.
 */
export const metadata: Metadata = {
  title: "Salis",
  description: "Água mineralizada para café especial, em gotas.",
};

export const viewport: Viewport = {
  // Mobile-first: the dosing screen is used with a phone flat on the counter.
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F5452",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      {/* fontVariables binds the next/font families into --font-body / --font-mono. */}
      <body className={fontVariables}>
        {/* AppShell is the navigation frame (440 px column, top bar, tab bar).
            It is the frame's only client component — it reads the path to decide
            the active tab and whether the tab bar shows — and `children` passes
            through it, so every screen stays a Server Component. */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
