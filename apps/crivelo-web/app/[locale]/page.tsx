// Coa homepage (RMP-191). The Crivelo shell (header / nav / footer) is provided
// by the [locale] layout; this page renders the calculator body inside it. The
// CoaCalculator owns the idle ↔ brew view state and the responsive layout. All
// copy resolves from the message catalog (RMP-193) via next-intl hooks.
import { setRequestLocale } from "next-intl/server";
import { CoaCalculator } from "../../components/coa";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Opt this route into static rendering for the resolved locale.
  setRequestLocale(locale);
  return <CoaCalculator />;
}
