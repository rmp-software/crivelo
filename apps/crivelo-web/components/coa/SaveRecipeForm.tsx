"use client";

/**
 * SaveRecipeForm (feature: coa-save-recipes) — the done-screen "Save recipe" form.
 *
 * A controlled @crivelo/ui Dialog that promotes the just-finished brew into an explicit,
 * named saved recipe. The form is the only place that enforces the store's "name is
 * required" contract: `addRecipe` throws on a blank name, so submit is disabled until the
 * trimmed name is non-empty (the store can never be reached with an invalid name from here).
 *
 * Fields: name (required, seeded from the params summary e.g. "20 g · 1:15"), bean (optional),
 * grind size (optional), and an optional ★ 1–5 rating selector. Optional text fields are only
 * passed to `addRecipe` when non-blank, and rating only when set, so a minimal recipe stays
 * minimal. On a successful save it closes the dialog and fires a Sonner success toast.
 *
 * Owns no last-brew logic — the silent `coa-last-brew` write happens in BrewTimer on entering
 * `done`; dismissing this form therefore leaves the last brew intact while adding nothing to
 * `coa-recipes`.
 *
 * Styling: house tokens/utilities only (no raw hex / no inline `var()`); the rating stars use
 * the teal `text-brand` accent when filled and the muted `text-fg-4` neutral when empty.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@crivelo/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@crivelo/ui/dialog";
import { Input } from "@crivelo/ui/input";
import { Label } from "@crivelo/ui/label";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { addRecipe, type RecipeParams } from "../../lib/recipes-store";
import { doseRatioSummary } from "../../lib/recipe-summary";
import { StarGlyph } from "./StarGlyph";

/** Shared CTA look, matching the BrewTimer pills (54px solid/outline). */
const CTA_BASE =
  "flex h-[54px] w-full cursor-pointer items-center justify-center gap-[9px] rounded-md p-0 font-body text-body font-semibold whitespace-normal has-[>svg]:px-0";
const CTA_SOLID =
  "bg-brand text-white border-none shadow-1 hover:bg-brand disabled:opacity-50 disabled:cursor-not-allowed";
const CTA_OUTLINE =
  "bg-transparent text-fg border border-border-strong shadow-none hover:bg-transparent hover:text-fg";

/** 1..5, the tappable rating range. */
const STARS = [1, 2, 3, 4, 5] as const;

export interface SaveRecipeFormProps {
  /** Controlled open state of the dialog. */
  open: boolean;
  /** Notifies the parent of an open-state change (close on backdrop/Esc/Cancel/save). */
  onOpenChange: (open: boolean) => void;
  /** The just-finished brew's params — the recipe being saved + the name seed. */
  params: RecipeParams;
}

export function SaveRecipeForm({ open, onOpenChange, params }: SaveRecipeFormProps) {
  const t = useTranslations("SaveRecipe");

  // The default name is the dose/ratio summary (e.g. "20 g · 1:15"). It is language-agnostic
  // so it works as a stored name without a locale.
  const defaultName = doseRatioSummary(params);
  const [name, setName] = useState(defaultName);
  const [bean, setBean] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [rating, setRating] = useState(0);

  // Re-seed the fields whenever a fresh form is opened (new params / re-entry of done), so a
  // previous edit doesn't bleed into the next save.
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setBean("");
      setGrindSize("");
      setRating(0);
    }
    // defaultName is derived purely from params; re-seed only on open or a params change.
  }, [open, defaultName]);

  const canSave = name.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    addRecipe({
      name,
      ...(bean.trim() !== "" && { bean: bean.trim() }),
      ...(grindSize.trim() !== "" && { grindSize: grindSize.trim() }),
      ...(rating > 0 && { rating }),
      params,
    });
    onOpenChange(false);
    toast.success(t("savedToast"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")} className="gap-5">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] font-bold tracking-[-0.01em] text-fg">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-small text-fg-3">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* name — required */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="recipe-name" className="text-fg-2">
              {t("nameLabel")}
            </Label>
            <Input
              id="recipe-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
          </div>

          {/* bean — optional */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="recipe-bean" className="text-fg-2">
              {t("beanLabel")}
            </Label>
            <Input
              id="recipe-bean"
              value={bean}
              onChange={(e) => setBean(e.target.value)}
              placeholder={t("beanPlaceholder")}
              autoComplete="off"
            />
          </div>

          {/* grind size — optional */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="recipe-grind" className="text-fg-2">
              {t("grindLabel")}
            </Label>
            <Input
              id="recipe-grind"
              value={grindSize}
              onChange={(e) => setGrindSize(e.target.value)}
              placeholder={t("grindPlaceholder")}
              autoComplete="off"
            />
          </div>

          {/* rating — optional ★ 1–5, tappable + clearable (tap the active star to clear) */}
          <div className="flex flex-col gap-2">
            <Label className="text-fg-2">{t("ratingLabel")}</Label>
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label={t("ratingLabel")}
            >
              {STARS.map((n) => {
                const filled = n <= rating;
                return (
                  // Intentionally a raw semantic radio (role="radio"), not the CTA
                  // `Button` wrapper, so the star toggle doesn't inherit button-CTA variants.
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n === rating}
                    aria-label={t("ratingStar", { n })}
                    // Tap the current rating to clear it; otherwise set to n.
                    onClick={() => setRating((r) => (r === n ? 0 : n))}
                    className={cn(
                      "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-surface-raised motion-reduce:transition-none",
                      filled ? "text-brand" : "text-fg-4",
                    )}
                  >
                    <StarGlyph size={22} filled={filled} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2.5 sm:flex-col">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(CTA_BASE, CTA_SOLID)}
          >
            {t("save")}
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(CTA_BASE, CTA_OUTLINE)}
          >
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
