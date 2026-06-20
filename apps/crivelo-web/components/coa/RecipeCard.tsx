"use client";

/**
 * RecipeCard (feature: coa-save-recipes) — one saved recipe on the `/recipes` list.
 *
 * Renders a saved recipe's name, optional bean / grind-size notes, optional ★ rating
 * (read-only), and the params summary, plus three actions:
 *   - "Brew again" → `brewHref(params, false)` (autostart=0 → the brew route's "ready" state),
 *   - "Edit"       → `editHref(params)` (the calculator pre-filled with these params),
 *   - "Delete"     → opens an @crivelo/ui AlertDialog; confirming calls `onDelete(id)`.
 * Both nav actions route through the locale-aware `useRouter` so the active locale prefix is
 * preserved; neither hand-builds a query string (the shared coa-nav helpers own that shape).
 *
 * Delete state lives in the parent list (RecipesList): this card is presentational and just
 * reports the confirmed id up via `onDelete`, so the list can drop it from React state without
 * a reload. The AlertDialog confirm is uncontrolled (Radix manages its open state); confirming
 * fires the Action handler and Radix closes it.
 *
 * Styling mirrors LastBrewCard: house tokens/utilities only (no raw hex / no inline `var()`),
 * the same raised surface (`bg-surface-raised`, `border-border`, `rounded-md`, `shadow-1`) and
 * the same solid/outline action pills. The params summary reuses `paramsSummary` + the localized
 * taste label (single source of truth — never re-derived here). The rating reuses the shared
 * `StarGlyph` (also used by SaveRecipeForm) in a read-only display.
 */
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@crivelo/ui/alert-dialog";
import { Button } from "../ui/Button";
import { useRouter } from "../../i18n/navigation";
import { brewHref, editHref } from "../../lib/coa-nav";
import type { SavedRecipe } from "../../lib/recipes-store";
import { paramsSummary } from "../../lib/recipe-summary";
import { tasteKey } from "../../lib/four-six";
import { Icon } from "./icons";
import { StarGlyph } from "./StarGlyph";
import { CAP, CARD_PILL_SOLID, CARD_PILL_OUTLINE, MONO } from "./style-tokens";

/** 1..5 — the rating scale, rendered read-only (filled vs. muted). */
const STARS = [1, 2, 3, 4, 5] as const;

export interface RecipeCardProps {
  recipe: SavedRecipe;
  /** Called with the recipe id once the delete is confirmed in the AlertDialog. */
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const t = useTranslations("Recipes");
  const tTaste = useTranslations("Taste");
  const router = useRouter();

  const { id, name, bean, grindSize, rating, params } = recipe;
  // Localized taste descriptor appended to the language-agnostic dose/ratio half.
  const summary = paramsSummary(params, tTaste(tasteKey(params.acidity)));

  return (
    <article
      className="rounded-md border border-border bg-surface-raised p-5 shadow-1"
      aria-label={name}
    >
      <h2 className="mb-1 font-display text-h4 font-semibold text-fg">{name}</h2>
      <div className={cn("mb-3 text-body text-fg-2", MONO)}>{summary}</div>

      {(bean || grindSize || rating) && (
        <dl className="mb-4 flex flex-col gap-1.5">
          {bean && (
            <div className="flex gap-2 text-small">
              <dt className={CAP}>{t("bean")}</dt>
              <dd className="text-fg-2">{bean}</dd>
            </div>
          )}
          {grindSize && (
            <div className="flex gap-2 text-small">
              <dt className={CAP}>{t("grind")}</dt>
              <dd className="text-fg-2">{grindSize}</dd>
            </div>
          )}
          {rating ? (
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={t("ratingValue", { n: rating })}
            >
              {STARS.map((n) => {
                const filled = n <= rating;
                return (
                  <StarGlyph
                    key={n}
                    size={16}
                    filled={filled}
                    className={filled ? "text-brand" : "text-fg-4"}
                  />
                );
              })}
            </div>
          ) : null}
        </dl>
      )}

      <div className="flex gap-2.5">
        <Button
          onClick={() => router.push(brewHref(params, false))}
          className={CARD_PILL_SOLID}
        >
          <Icon name="play" size={16} /> {t("brewAgain")}
        </Button>
        <Button
          onClick={() => router.push(editHref(params))}
          className={CARD_PILL_OUTLINE}
        >
          {t("edit")}
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            aria-label={t("deleteAria", { name })}
            className="mt-2.5 flex h-11 w-full rounded-md border-none bg-transparent p-0 font-body text-small font-semibold whitespace-normal text-fg-3 shadow-none hover:bg-transparent hover:text-fg"
          >
            {t("delete")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-h4 font-bold text-fg">
              {t("confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-small text-fg-3">
              {t("confirmBody", { name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirmCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(id)}>
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
