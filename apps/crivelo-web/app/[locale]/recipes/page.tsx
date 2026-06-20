// Coa saved-recipes route (feature: coa-save-recipes). Lists the explicitly
// saved `coa-recipes` as cards, each re-loadable via "Brew again" / "Edit" and
// removable via "Delete". The Crivelo shell (header / nav / footer) comes from
// the [locale] layout; this page renders the list body inside it.
//
// The page itself is a static server shell: the saved recipes live in
// `localStorage`, which is null on the server, so the actual list is read +
// rendered client-side (post-mount) by `RecipesList`. Rendering the list on the
// server would either always show empty (stale) or trip a hydration mismatch, so
// the server only sets the request locale and mounts the client component — no
// `searchParams`, so the route stays statically renderable for each locale.
import { setRequestLocale } from "next-intl/server";
import { RecipesList } from "../../../components/coa/RecipesList";

export default async function RecipesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Opt this route into static rendering for the resolved locale.
  setRequestLocale(locale);
  return <RecipesList />;
}
