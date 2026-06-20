"use client";

/**
 * RecipesList (feature: coa-save-recipes) — the client body of the `/recipes` route.
 *
 * Owns the saved-recipes list as React state so a delete updates the screen immediately
 * (drop the card from state, no reload). The store is the source of truth on disk; this
 * component mirrors it in state after mount and keeps the two in lockstep on delete.
 *
 *  - **Client-only after mount.** `getRecipes()` reads `localStorage`, which is null on the
 *    server. We read it in an effect behind a `mounted` flag so the server and the first
 *    client paint render the same neutral shell (no hydration mismatch), then the real list
 *    (or the empty state) appears on the post-mount commit. This mirrors LastBrewCard.
 *  - **Delete updates state + storage.** `handleDelete` calls `deleteRecipe(id)` (persist) and
 *    filters the id out of the in-memory list, so the card disappears without re-reading disk.
 *
 * Until mount we render the header + an empty content region (not the empty state and not the
 * cards) — showing the "no recipes" empty state before the storage read would flash the wrong
 * message on every load. The header is locale-aware; all copy resolves from the `Recipes`
 * namespace. Styling: house tokens/utilities only (no raw hex / no inline `var()`), the list
 * container matches the calculator's mobile column width.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@crivelo/ui/empty-state";
import { cn } from "@crivelo/ui/lib/utils";
import { useRouter } from "../../i18n/navigation";
import {
  deleteRecipe,
  getRecipes,
  type SavedRecipe,
} from "../../lib/recipes-store";
import { RecipeCard } from "./RecipeCard";
import { CAP } from "./style-tokens";

export function RecipesList() {
  const t = useTranslations("Recipes");
  const router = useRouter();

  // `coa-recipes` lives in localStorage (null on the server). Read it only after mount so the
  // server + first client paint agree, then reveal the list/empty state on the post-mount commit.
  const [mounted, setMounted] = useState(false);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  useEffect(() => {
    // `setMounted(true)` runs in `finally` so the UI always reaches a displayable state.
    // `getRecipes` is documented never-throw, but if it ever did, leaving `mounted` false
    // would strand the screen blank forever (no list, no empty state, no error) — the
    // `finally` removes that silent-blank failure mode.
    try {
      setRecipes(getRecipes());
    } finally {
      setMounted(true);
    }
  }, []);

  const handleDelete = (id: string) => {
    // Persist first (source of truth on disk), then drop the card from React state so the list
    // updates immediately without re-reading storage.
    deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <main className="mx-auto box-border w-full max-w-[480px] px-5 pt-7 pb-8">
      <header className="mb-6">
        <div className={cn(CAP, "mb-2")}>{t("title")}</div>
        <p className="m-0 max-w-[20em] font-serif text-[22px] italic leading-[1.28] text-fg-2">
          {t("subtitle")}
        </p>
      </header>

      {/* Before mount: render nothing in the content region so neither the cards nor the empty
          state flash before the storage read resolves. */}
      {!mounted ? null : recipes.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={{ label: t("emptyAction"), onClick: () => router.push("/") }}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
