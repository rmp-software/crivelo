import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@crivelo/tokens/fonts";
import { Shell, NO_FOUC_SCRIPT, type Lang } from "../../components/shell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Coa — Crivelo",
  description: "Tools for people who live coffee.",
};

// All routes live under [locale], so this IS the App Router root layout: it
// renders the document shell (<html lang>/<body>) + foundation fonts. Prerender
// both locales without middleware via generateStaticParams; full next-intl
// wiring (provider, locale validation, theme/shell, default-locale redirect) is
// a later sub-issue (RMP-193).
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // RMP-193 will own real locale routing; for now seed the EN/PT switcher from
  // the path locale so the active state matches the URL on first render.
  const initialLang: Lang = params.locale === "pt" ? "PT" : "EN";
  return (
    // suppressHydrationWarning: the no-FOUC script sets data-theme on <html>
    // before React hydrates, so the server/client attribute can differ by design.
    <html lang={params.locale} suppressHydrationWarning>
      <head>
        {/* No-FOUC: set the theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body className={fontVariables}>
        <Shell initialLang={initialLang}>{children}</Shell>
      </body>
    </html>
  );
}
