import type { Metadata, Viewport } from "next";
import { pwaMetadata, pwaViewport } from "@crivelo/pwa";
import { SerwistProvider } from "@crivelo/pwa/serwist-provider";
import { fontVariables } from "@salis/tokens/fonts";
import { AppShell } from "./app-shell";
import { salisPwa } from "./pwa.config";
import "./globals.css";

/**
 * Salis root layout.
 *
 * `lang="pt-BR"` is fixed, not negotiated: Salis ships in Brazilian Portuguese
 * only (Juliana's students), so there is no i18n routing and no locale segment.
 * Code, comments and docs stay English — see apps/salis/CLAUDE.md. That same
 * single-locale shape is why the offline half is configured with `locales: []`
 * (see app/sw.ts).
 *
 * PWA: everything shared comes from @crivelo/pwa, driven by app/pwa.config.tsx.
 * `pwaMetadata` adds the applicationName, the iOS web-app meta (including the
 * legacy `apple-mobile-web-app-capable` tag Next drops and iOS requires for the
 * splash) and the apple-touch-startup-image link tags; `pwaViewport` supplies the
 * theme colour and the mobile viewport from that same config, so the manifest,
 * the icon tiles and the browser chrome can never drift apart. Both are spread,
 * so the app's own title/description stay app-local.
 *
 * Metadata is deliberately a STATIC object, not an async `generateMetadata` — see
 * the note in next.config.ts about streamed metadata and the iOS splash.
 */
export const metadata: Metadata = {
  ...pwaMetadata(salisPwa),
  title: "Salis",
  description: "Água mineralizada para café especial, em gotas.",
  manifest: "/manifest.webmanifest",
};

// Mobile-first: the dosing screen is used with a phone flat on the counter.
export const viewport: Viewport = pwaViewport(salisPwa);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      {/* fontVariables binds the next/font families into --font-body / --font-mono. */}
      <body className={fontVariables}>
        {/* Registers /serwist/sw.js on mount — the offline half's client half.
            It renders no DOM of its own, so it wraps the shell rather than
            sitting beside it. */}
        <SerwistProvider swUrl="/serwist/sw.js">
          {/* AppShell is the navigation frame (440 px column, top bar, tab bar).
              It is the frame's only client component — it reads the path to decide
              the active tab and whether the tab bar shows — and `children` passes
              through it, so every screen stays a Server Component. */}
          <AppShell>{children}</AppShell>
        </SerwistProvider>
      </body>
    </html>
  );
}
