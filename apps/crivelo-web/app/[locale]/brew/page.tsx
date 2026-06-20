// Coa brew route (feature: coa-save-recipes). The running brew flow (BrewTimer),
// extracted out of CoaCalculator's in-page view toggle into its own route driven
// entirely by the URL query (recipe params + autostart). The Crivelo shell
// (header / nav / footer) is provided by the [locale] layout; this page renders
// the brew body inside it.
//
// BrewView is a Client Component that reads the recipe params + autostart flag
// from `useSearchParams`, so it sits behind a Suspense boundary (Next requires a
// suspense boundary around `useSearchParams` to keep the route statically
// renderable — the shell streams while the client reads the query on hydration).
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { BrewSkeleton, BrewView } from "../../../components/coa/BrewView";

export default async function BrewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Opt this route into static rendering for the resolved locale.
  setRequestLocale(locale);
  // The fallback holds the brew screen's layout (ring + action + CTA height) so
  // the shell doesn't collapse-then-shift while the client reads the query and
  // the timer chunk loads. It matches the `dynamic` `loading` skeleton in BrewView.
  return (
    <Suspense fallback={<BrewSkeleton />}>
      <BrewView />
    </Suspense>
  );
}
