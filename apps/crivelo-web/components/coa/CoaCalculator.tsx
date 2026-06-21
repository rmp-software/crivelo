"use client";

/**
 * CoaCalculator (RMP-191) — the Coa homepage body: the 4:6 calculator (idle) and
 * the brew-timer view, switched by a `view` state. Ported from the idle layout
 * in apps/crivelo-web/.design/project/coa-home.jsx (intro / pad / inputs / panel /
 * schedule / CTA), minus the shell chrome (Header / NavSheet / Footer), which the
 * Shell already provides via app/[locale]/layout.tsx.
 *
 * Responsive (RMP-226): ONE markup tree; CSS breakpoints pick the arrangement, so
 * the first paint is already correct at any width (no useViewport, no JS layout
 * measurement, no mobile→desktop flash). Breakpoint mapping: base = mobile (<768,
 * single column intro → pad → inputs → schedule → CTA); `md:` (≥768, was the
 * useViewport `wide`/700 flip) → two columns (left: intro + pad + inputs; right:
 * "Your recipe" panel card with big water total + schedule + CTA); `lg:` (≥1024,
 * was `desktop`) → roomier gap/padding + the sticky panel. On mobile the grid
 * collapses to block flow, so the left div (intro → pad → inputs) renders above the
 * right div (panel header hidden → schedule → CTA), giving the exact mobile order.
 *
 * "Begin brew" navigates to the `/[locale]/brew` route (feature: coa-save-recipes)
 * with the recipe params + `autostart=1` in the URL query, so the brew flow is a
 * pure function of its URL. The brew route re-derives the same recipe from those
 * params via the 4:6 engine, so the timer shows exactly the idle schedule.
 *
 * Styling (RMP-214): the foundation's neutral semantic tokens ride their registered
 * utility classes (`text-fg-3`, `border-border`, `bg-surface-raised`, …). The teal
 * accent rides the promoted `bg-brand` / `text-accent-ink` tokens. The responsive
 * arrangement (container max-width, grid, panel chrome, fonts) is now fully
 * CSS-driven via `md:` / `lg:` utilities — no runtime container/panel sizing, no
 * inline layout `style`.
 */
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { useRouter } from "../../i18n/navigation";
import { useRecipe } from "./useRecipe";
import { TastePad } from "./TastePad";
import { RecipeInputs } from "./RecipeInputs";
import { PourSchedule } from "./PourSchedule";
import { LastBrewBar } from "./LastBrewBar";
import { Icon } from "./icons";
import { tasteKey } from "../../lib/four-six";
import { brewHref } from "../../lib/coa-nav";
import { DEFAULT_PARAMS, type RecipeParams } from "../../lib/recipes-store";
import { CAP, MONO } from "./style-tokens";

/**
 * Props seeded by the server `page.tsx` from the URL query (the "Edit" landing). The
 * server parses + clamps `dose/ratio/acidity/strength` via `parseRecipeParams` and
 * passes the result here, so the calculator's first paint already reflects the URL — no
 * client `useSearchParams`/Suspense and no hydration mismatch (server + client seed from
 * the same params). A bare `/[locale]` (no query) yields the calculator defaults.
 */
export interface CoaCalculatorProps {
  initialParams?: RecipeParams;
}

export function CoaCalculator({
  initialParams = DEFAULT_PARAMS,
}: CoaCalculatorProps = {}) {
  const t = useTranslations("Calculator");
  const tTaste = useTranslations("Taste");
  const router = useRouter();

  const {
    dose,
    setDose,
    ratio,
    setRatio,
    acidity,
    setAcidity,
    strengthPours,
    setStrength,
    recipe,
  } = useRecipe(initialParams);

  const startBrew = () => {
    // "Begin brew" navigates to the brew route with the current recipe params +
    // autostart=1. The brew flow now lives entirely on its own URL; starting with
    // these params resets any stale `coa-brew` session (the timer stamps + matches
    // params), so it opens on the pre-roll instead of resuming a previous brew.
    router.push(brewHref({ dose, ratio, acidity, strengthPours }, true));
  };

  // Localized "{taste} · {n} pours" readout shared by the panel header.
  const tasteSummary = t("tasteSummary", {
    taste: tTaste(tasteKey(acidity)),
    count: strengthPours,
  });

  // ---------- pieces ----------
  const intro = (
    <div className="md:mb-6">
      <div className={cn(CAP, "mb-2")}>{t("introCaption")}</div>
      <p className="m-0 max-w-[17em] font-serif text-[19px] italic leading-[1.28] text-fg-2 md:text-[25px] lg:text-[30px]">
        {t("introLine")}
      </p>
    </div>
  );

  const pad = (
    <TastePad
      acidity={acidity}
      strengthPours={strengthPours}
      setAcidity={setAcidity}
      setStrength={setStrength}
    />
  );

  const inputs = (
    <RecipeInputs
      dose={dose}
      ratio={ratio}
      waterG={recipe.waterG}
      setDose={setDose}
      setRatio={setRatio}
    />
  );

  // Wide-only header (the big 44px water number + summary). Mobile shows the water
  // total in the inputs row instead, so this is hidden below md.
  const panelHeader = (
    <div className="mb-4 hidden border-b border-border pb-[18px] md:block">
      <div className={cn(CAP, "mb-2")}>{t("yourRecipe")}</div>
      <div className="flex items-end gap-3.5">
        <span
          className={cn(
            "text-[44px] font-semibold leading-[0.9] tracking-[-0.02em] whitespace-nowrap text-accent-ink",
            MONO,
          )}
        >
          {recipe.waterG}
          <span className="text-h3 text-fg-3">
            {" "}
            {t("grams")}
          </span>
        </span>
        <span className="pb-1 text-[13.5px] leading-[1.4] text-fg-2">
          {t("doseRatioSummary", { dose, ratio })}
          <br />
          {tasteSummary}
        </span>
      </div>
    </div>
  );

  const schedule = <PourSchedule recipe={recipe} />;

  const cta = (
    <>
      {/* Routed through the app-local Button wrapper (RMP-217 commodity-UI sweep);
          the bespoke geometry (56px height, brand fill, mono time tail, 18px play
          icon) rides in className via tailwind-merge so the primitive's
          buttonVariants defaults (rounded-md, h-9/px, bg-primary, text-sm,
          font-medium, gap-2, hover, the 16px svg rule) are neutralised — pixel
          identical to the prior hand-rolled <button>. */}
      <Button
        onClick={startBrew}
        className="mt-6 flex h-14 w-full gap-[10px] rounded-md border-none bg-brand p-0 font-body text-body font-semibold whitespace-normal text-white shadow-1 hover:bg-brand has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-[18px]"
      >
        <Icon name="play" size={18} /> {t("beginBrew")}{" "}
        <span className={cn("opacity-[0.85]", MONO)}>{recipe.totalTime}</span>
      </Button>
      <div className="mt-4 text-center">
        <a
          href="https://en.philocoffea.com/blogs/blog/coffee-brewing-method"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[7px] text-small text-fg-2 no-underline"
        >
          <Icon name="book" size={15} className="text-fg-3" />
          <span className="underline decoration-border-strong underline-offset-[3px]">
            {t("methodLink")}
          </span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-fg-3"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </>
  );

  return (
    // ONE tree, CSS picks the arrangement. Container max-width / padding are the
    // old per-breakpoint CONTAINER_MAX (390 / 680 / 1060) expressed as responsive
    // utilities. The mobile bottom-padding reserves room for the sticky LastBrewBar
    // (bar height + gap + safe-area; env() is a runtime bridge, not a token) and
    // collapses to pb-2 once two-column (the bar is hidden there).
    <main className="mx-auto box-border max-w-[390px] px-5 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:max-w-[680px] md:px-6 md:pt-7 md:pb-2 lg:max-w-[1060px] lg:pt-10">
      <div className="flex flex-col gap-[22px] md:grid md:grid-cols-2 md:items-start md:gap-9 lg:gap-14">
        <div className="flex flex-col gap-[22px]">
          {intro}
          {/* Wide layout: the last brew reads as a compact inline row in the left
              column (a floating bottom bar reads oddly across the wide canvas).
              Hidden below md; self-hides when no last brew exists. */}
          <div className="hidden md:block">
            <LastBrewBar variant="inline" />
          </div>
          {pad}
          {inputs}
        </div>
        {/* Unstyled passthrough on mobile (the grid collapses to block flow, so
            this renders below the left column → schedule → CTA); a sticky recipe
            card from md up (panel chrome applied only at md+). */}
        <div className="md:rounded-md md:border md:border-border md:bg-surface-raised md:p-6 md:shadow-1 lg:sticky lg:top-[90px] lg:p-7">
          {panelHeader}
          {schedule}
          {cta}
        </div>
      </div>
      {/* Sticky bottom bar (narrow only): fixed/out-of-flow → zero layout shift on
          its post-mount reveal. Hidden at md+; self-hides when no last brew. */}
      <div className="md:hidden">
        <LastBrewBar variant="bar" />
      </div>
    </main>
  );
}
