"use client";

/**
 * CoaCalculator (RMP-191) — the Coa homepage body: the 4:6 calculator (idle) and
 * the brew-timer view, switched by a `view` state. Ported from the idle layout
 * in apps/crivelo-web/.design/project/coa-home.jsx (intro / pad / inputs / panel /
 * schedule / CTA), minus the shell chrome (Header / NavSheet / Footer), which the
 * Shell already provides via app/[locale]/layout.tsx.
 *
 * Responsive (breakpoints from the design via useViewport): mobile <700 single
 * column (intro → pad → inputs → schedule → CTA); tablet 700–1023 and desktop
 * ≥1024 two columns (left: intro + pad + inputs; right: sticky "Your recipe"
 * panel with big water total + schedule + CTA).
 *
 * "Begin brew" navigates to the `/[locale]/brew` route (feature: coa-save-recipes)
 * with the recipe params + `autostart=1` in the URL query, so the brew flow is a
 * pure function of its URL. The brew route re-derives the same recipe from those
 * params via the 4:6 engine, so the timer shows exactly the idle schedule.
 *
 * Styling (RMP-214): the foundation's neutral semantic tokens (--fg-2/3, --border,
 * --surface-raised, --font-serif/mono, …) are referenced via arbitrary-value
 * utility classes (`text-[color:var(--fg-3)]`), NOT inline `style` (the
 * no-`var(--)`-in-`style` rule). The teal accent rides the promoted `bg-brand` /
 * `text-accent-ink` tokens. The only surviving inline `style` is the wide-layout
 * container/panel sizing, which is driven by the runtime `bp` viewport value.
 */
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { buttonVariants } from "@crivelo/ui/button";
import { Button } from "../ui/Button";
import { Link, useRouter } from "../../i18n/navigation";
import { useRecipe } from "./useRecipe";
import { useViewport, type Breakpoint } from "./useViewport";
import { TastePad, type PadDims } from "./TastePad";
import { RecipeInputs } from "./RecipeInputs";
import { PourSchedule } from "./PourSchedule";
import { LastBrewCard } from "./LastBrewCard";
import { Icon } from "./icons";
import { tasteKey } from "../../lib/four-six";
import { brewHref } from "../../lib/coa-nav";
import { DEFAULT_PARAMS, type RecipeParams } from "../../lib/recipes-store";
import { CAP, MONO } from "./style-tokens";

const PAD_DIMS: Record<Breakpoint, PadDims> = {
  desktop: { w: 430, h: 350, gap: 48 },
  tablet: { w: 380, h: 300, gap: 41 },
  mobile: { w: 350, h: 280, gap: 38 },
};

const CONTAINER_MAX: Record<Breakpoint, number> = {
  desktop: 1060,
  tablet: 680,
  mobile: 390,
};

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
  const bp = useViewport();
  const router = useRouter();
  const wide = bp !== "mobile";
  const containerMax = CONTAINER_MAX[bp];

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
    <div className={wide ? "mb-6" : "mb-5"}>
      <div className={cn(CAP, "mb-2")}>{t("introCaption")}</div>
      <p
        className={cn(
          "m-0 max-w-[17em] font-serif italic leading-[1.28] text-fg-2",
          bp === "desktop"
            ? "text-[30px]"
            : bp === "tablet"
              ? "text-[25px]"
              : "text-[19px]",
        )}
      >
        {t("introLine")}
      </p>
    </div>
  );

  // Home-only extras: the last-brew card (self-hiding when no last brew exists) and
  // the saved-recipes entry point. The entry is a locale-aware <Link> (prefetch,
  // middle/right-click) styled through the @crivelo/ui buttonVariants `link` look —
  // a secondary text-link entry point, not a filled CTA. The i18n Link injects the
  // active locale prefix, so it resolves to /[locale]/recipes. (The recipes route is
  // built in a later task — the entry is already correct.)
  const homeExtras = (
    <div className="mb-5">
      <LastBrewCard />
      <Link
        href="/recipes"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-auto gap-1 p-0 text-small font-medium text-fg-2 underline decoration-border-strong underline-offset-[3px] hover:text-fg has-[>svg]:px-0",
        )}
      >
        {t("savedRecipes")}
        <Icon name="chevR" size={14} className="text-fg-3" />
      </Link>
    </div>
  );

  const pad = (
    <TastePad
      acidity={acidity}
      strengthPours={strengthPours}
      setAcidity={setAcidity}
      setStrength={setStrength}
      dims={PAD_DIMS[bp]}
      center={!wide}
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

  const panelHeader = wide && (
    <div className="mb-4 border-b border-border pb-[18px]">
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

  const panelClass = cn(
    "rounded-md border border-border bg-surface-raised shadow-1",
    bp === "desktop" ? "p-7" : "p-6",
  );

  if (wide) {
    return (
      // last-resort: container max-width is the runtime per-breakpoint
      // CONTAINER_MAX value (desktop 1060 / tablet 680).
      <main
        className={cn(
          "mx-auto box-border",
          bp === "desktop" ? "px-6 pt-10 pb-2" : "px-6 pt-7 pb-2",
        )}
        style={{ maxWidth: containerMax }}
      >
        <div
          className={cn(
            "grid grid-cols-2 items-start",
            bp === "desktop" ? "gap-14" : "gap-9",
          )}
        >
          <div className="flex flex-col gap-[22px]">
            {intro}
            {homeExtras}
            {pad}
            {inputs}
          </div>
          <div
            className={cn(
              panelClass,
              bp === "desktop" ? "sticky top-[90px]" : "static",
            )}
          >
            {panelHeader}
            {schedule}
            {cta}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto box-border max-w-[390px] px-5 pt-5 pb-2">
      {intro}
      {homeExtras}
      <div className="mb-3">{pad}</div>
      <div className="mb-[22px]">{inputs}</div>
      {schedule}
      {cta}
    </main>
  );
}
