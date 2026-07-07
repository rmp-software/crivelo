"use client";

/**
 * RecipeCard (feature: coa-save-recipes) — one saved recipe on the `/recipes` list.
 *
 * Redesign "variant A · Spec-led + chips" (.design/recipe-card-mockups.html). The card
 * leads with the recipe's IDENTITY, dedup'd so the title never repeats the spec line:
 *   - **Default-named recipe** (`name === doseRatioSummary(params)` — the user kept the
 *     Save-form's seeded name): render the dose·ratio AS the title, in mono, and DON'T
 *     render a separate summary subline (no duplication — the key fix the redesign targets).
 *   - **Custom-named recipe**: render the custom `name` as the serif (font-display) title
 *     with the dose·ratio summary (`doseRatioSummary`, mono, quiet `text-fg-3`) as a
 *     subline — taste is NOT repeated here since the taste chip below already shows it.
 * A quiet "saved on" date line follows when the record carries `createdAt` (legacy
 * records without it render no date).
 *
 * Below the title block: a wrapping chip row — the localized **taste chip** (the flavor
 * identity, always shown: brand-soft bg + accent-ink text) plus optional **bean / grind**
 * metadata chips (surface-sunken, a small uppercase label + value), replacing the old
 * ragged label/value `<dl>`. The read-only ★ rating sits top-right beside the title.
 *
 * Actions are a single row: "Brew again" (solid, flex-1) + "Edit" (outline) + a quiet
 * **trash icon button** that opens the @crivelo/ui AlertDialog; confirming calls `onDelete(id)`.
 * This replaces the old orphaned full-width centered Delete. All three actions share one row
 * and must not overflow at phone widths (~360px) — `Brew again` flexes, Edit/trash hug.
 *
 * Both nav actions route through the locale-aware `useRouter` (preserves the active locale
 * prefix) and the shared coa-nav helpers (single source of the brew/edit query shape).
 *
 * Delete state lives in the parent list (RecipesList): this card is presentational and just
 * reports the confirmed id up via `onDelete`, so the list can drop it from React state without
 * a reload. The AlertDialog confirm is uncontrolled (Radix manages its open state).
 *
 * Styling: house tokens/utilities only (no raw hex / no inline `var()`), the same raised
 * surface as LastBrewCard. Summary/taste reuse `doseRatioSummary` + the
 * localized taste label (single source of truth — never re-derived here). The rating reuses
 * the shared `StarGlyph`.
 */
import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
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
import { doseRatioSummary } from "../../lib/recipe-summary";
import { tasteKey } from "../../lib/four-six";
import { Icon } from "./icons";
import { StarGlyph } from "./StarGlyph";
import { CARD_PILL_SOLID, CARD_PILL_OUTLINE, MONO } from "./style-tokens";

/** 1..5 — the rating scale, rendered read-only (filled vs. muted). */
const STARS = [1, 2, 3, 4, 5] as const;

/**
 * A metadata pill in the chip row. The taste chip (the flavor identity) is the accent
 * variant; bean/grind are the neutral variant with a small uppercase key label.
 */
function Chip({
  label,
  children,
  accent = false,
}: {
  /** Optional uppercase key (e.g. "Bean"). Omitted for the taste chip. */
  label?: string;
  children: ReactNode;
  /** The taste chip — brand-soft bg + accent-ink text instead of the neutral sunken chip. */
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        // `min-h-7` (not a fixed height) so a long value wraps and grows the pill
        // instead of spilling out of it; `py-1` keeps the single-line height ~28px.
        "inline-flex min-h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-small",
        accent
          ? "border-transparent bg-brand-soft font-semibold text-accent-ink"
          : "border-border bg-surface-sunken text-fg-2",
      )}
    >
      {label ? (
        <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-fg-3">
          {label}
        </span>
      ) : null}
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

export interface RecipeCardProps {
  recipe: SavedRecipe;
  /** Called with the recipe id once the delete is confirmed in the AlertDialog. */
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const t = useTranslations("Recipes");
  const tTaste = useTranslations("Taste");
  const router = useRouter();

  const format = useFormatter();
  const { id, name, bean, grindSize, rating, params, createdAt } = recipe;
  const tasteLabel = tTaste(tasteKey(params.acidity));
  // Identity dedup: if the user kept the default name (the dose·ratio string), the title
  // IS that string (in mono) and there's no separate spec subline. A custom name is the
  // serif title with the full params summary as a quiet mono subline beneath it.
  const isDefaultName = name === doseRatioSummary(params);
  // Bind each "·" to the token after it (non-breaking space *after* the middot) so the
  // subline wraps as whole "· value" units — a line break can still land at the normal
  // space *before* a "·", but never right after one (no orphaned middot at 360px / pt-BR).
  // Dose·ratio + pour count — the taste word already renders as the accent Chip
  // below, so appending it here (the old `paramsSummary`) showed it twice; the pour
  // count is the user-chosen parameter otherwise shown nowhere on the card. When the
  // title already IS the dose·ratio string (default name), the subline carries only
  // the pours.
  const summary = (
    isDefaultName
      ? t("pours", { count: params.strengthPours })
      : `${doseRatioSummary(params)} · ${t("pours", { count: params.strengthPours })}`
  ).replace(/· /g, "· ");
  // Legacy records saved before `createdAt` existed simply render no date.
  const savedDate =
    typeof createdAt === "number"
      ? format.dateTime(new Date(createdAt), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <article
      className="rounded-md border border-border bg-surface-raised p-[18px] shadow-1"
      aria-label={name}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={cn(
              "font-semibold text-fg",
              isDefaultName
                ? cn("text-[18px]", MONO)
                : "font-display text-h3 leading-tight",
            )}
          >
            {name}
          </h2>
          <div className={cn("mt-1 text-[13px] text-fg-3", MONO)}>{summary}</div>
          {savedDate ? (
            <div className="mt-1 text-[12px] text-fg-4">
              {t("savedOn", { date: savedDate })}
            </div>
          ) : null}
        </div>

        {rating ? (
          <div
            className="mt-1 flex shrink-0 items-center gap-0.5"
            role="img"
            aria-label={t("ratingValue", { n: rating })}
          >
            {STARS.map((n) => {
              const filled = n <= rating;
              return (
                <StarGlyph
                  key={n}
                  size={15}
                  filled={filled}
                  className={filled ? "text-brand" : "text-fg-4"}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip accent>{tasteLabel}</Chip>
        {bean ? <Chip label={t("bean")}>{bean}</Chip> : null}
        {grindSize ? <Chip label={t("grind")}>{grindSize}</Chip> : null}
      </div>

      <div className="mt-4 flex gap-2.5">
        <Button
          onClick={() => router.push(brewHref(params, false))}
          className={cn(CARD_PILL_SOLID, "min-w-0 px-3 whitespace-nowrap")}
        >
          <Icon name="play" size={16} /> {t("brewAgain")}
        </Button>
        {/* Edit collapses to an icon-only square on phone widths (`< sm`) so the
            flex-1 "Brew again" label never clips at ~360–393px — notably with the
            longer pt-BR copy ("Preparar de novo"). The label returns on `sm`+. The
            `aria-label` keeps it accessible while the text is hidden. */}
        <Button
          onClick={() => router.push(editHref(params))}
          aria-label={t("edit")}
          className={cn(
            CARD_PILL_OUTLINE,
            "size-11 flex-none items-center justify-center gap-2 p-0 whitespace-nowrap [&_svg:not([class*='size-'])]:size-4 sm:w-auto sm:px-4",
          )}
        >
          <Icon name="edit" size={16} />
          <span className="hidden sm:inline">{t("edit")}</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              aria-label={t("deleteAria", { name })}
              className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border-strong bg-transparent p-0 text-fg-3 shadow-none hover:bg-transparent hover:text-fg [&_svg:not([class*='size-'])]:size-[17px]"
            >
              <Icon name="trash" size={17} />
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
              <AlertDialogAction variant="destructive" onClick={() => onDelete(id)}>
                {t("confirmDelete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}
