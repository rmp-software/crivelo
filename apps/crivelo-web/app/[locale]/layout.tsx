import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontVariables } from "@crivelo/tokens/fonts";
import { pwaMetadata, pwaViewport } from "@crivelo/pwa";
import { Toaster } from "@crivelo/ui/sonner";
import { Shell, NO_FOUC_SCRIPT } from "../../components/shell";
import { routing } from "../../i18n/routing";
import { criveloPwa } from "../pwa.config";
import "../globals.css";

// All routes live under [locale], so this IS the App Router root layout: it
// renders the document shell (<html lang>/<body>) + foundation fonts and wires
// next-intl (RMP-193) — the per-locale message provider + the no-FOUC theme
// script + the Crivelo Shell. Prerender both locales statically.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Localized document metadata, resolved from the message catalog.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
    // PWA: applicationName + iOS web-app meta (RMP / add-to-home-screen). The
    // per-locale manifest link is rendered manually in <head> (below) — emitting
    // it via metadata.manifest makes Next inject crossorigin="use-credentials".
    ...pwaMetadata(criveloPwa),
  };
}

// PWA theme colour + mobile viewport defaults (RMP / add-to-home-screen).
export const viewport: Viewport = pwaViewport(criveloPwa);

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Reject unknown locales (e.g. /fr) with a 404 instead of rendering an empty
  // catalog.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enable static rendering for this locale + distribute it to Server Components.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    // suppressHydrationWarning: the no-FOUC script sets data-theme on <html>
    // before React hydrates, so the server/client attribute can differ by design.
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Per-locale PWA manifest. Rendered manually (not via metadata.manifest)
            so Next doesn't inject crossorigin="use-credentials" on the link. */}
        <link rel="manifest" href={`/manifest/${locale}`} />
        {/* No-FOUC: set the theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body className={fontVariables}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Shell>{children}</Shell>
          {/* App-wide Sonner toast outlet (success toast on saving a recipe, etc.).
              Mounted once at the document root so any client surface can fire `toast`
              from the same module instance; inherits the house tokens via the alias
              layer (see @crivelo/ui/sonner). */}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
