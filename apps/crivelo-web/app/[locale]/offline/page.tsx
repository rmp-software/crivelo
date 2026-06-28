// Localized offline fallback (offline / Phase 1B). Served by the service worker
// for a never-visited document request while offline (the next-intl middleware
// does NOT run offline, so the per-locale SW fallback points here). It is a plain
// static server page inside normal i18n routing, so it is prerendered for both
// locales and precached by createCriveloSerwistRoute's additionalPrecacheEntries.
//
// The app is fully functional offline once cached, so this is only reached for a
// route that was never cached. It points the user back to the calculator (`/`),
// which IS precached and works offline. Copy resolves from the `Offline`
// namespace; styling reuses the house tokens/utilities (no raw hex / inline var).
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@crivelo/ui/button";
import { Link } from "../../../i18n/navigation";
import { CAP } from "../../../components/coa/style-tokens";

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Opt this route into static rendering for the resolved locale.
  setRequestLocale(locale);
  return <OfflineBody />;
}

function OfflineBody() {
  const t = useTranslations("Offline");
  return (
    <main className="mx-auto box-border flex w-full max-w-[480px] flex-col items-start px-5 pt-7 pb-8">
      <div className={`${CAP} mb-2`}>{t("caption")}</div>
      <h1 className="m-0 max-w-[16em] font-serif text-[26px] italic leading-[1.2] text-fg">
        {t("title")}
      </h1>
      <p className="mt-3 mb-6 max-w-[24em] text-base leading-normal text-fg-2">
        {t("body")}
      </p>
      {/* Canonical button look via the shared primitive's variants — the
          design-system supplies the foreground/background tokens (no hand-set
          colours). next-intl's Link prefixes the active locale, so "/" resolves to
          the precached locale shell (the calculator). */}
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        {t("action")}
      </Link>
    </main>
  );
}
