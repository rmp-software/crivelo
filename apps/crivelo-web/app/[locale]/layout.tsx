import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@crivelo/tokens/fonts";
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
  return (
    <html lang={params.locale}>
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
