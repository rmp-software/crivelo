import { TopBar } from "../top-bar";
import { RecipeList } from "./recipe-list";

/**
 * S1 · Receitas — the home tab, where the four-tap spine starts
 * (`docs/01-v1-plan.md` § Screens).
 *
 * The screen stays a Server Component: the header is static, and the list is
 * the only part that reads device state, so the `"use client"` boundary sits one
 * level down in `RecipeList`.
 *
 * The title is the brand, not the tab name — the wireframe's header reads
 * `Salis`, and the tab bar below already says Receitas.
 *
 * NO `rightAction`. The wireframe shows `⚙` there, but the settings screen it
 * would open does not exist in v1's scope, and a control that goes nowhere is
 * worse than no control. (The wireframe's `Salis` sits on the 56 px bar beside
 * it; `TopBar` has no left slot on a root tab, so the brand lockup is the large
 * title here. Giving the bar a brand slot is a change to `top-bar.tsx`, which
 * this sub-issue does not own.)
 */
export default function ReceitasPage() {
  return (
    <>
      <TopBar title="Salis" subtitle="Escolha uma receita." />
      <RecipeList />
    </>
  );
}
