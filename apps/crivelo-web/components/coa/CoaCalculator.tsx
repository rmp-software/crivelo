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
 * View state: idle ↔ brew. "Begin brew" → brew (the RMP-192 BrewTimer); the math
 * (lib/four-six.ts) is computed once here and handed to whichever view renders,
 * so the timer receives the exact same recipe the idle schedule shows.
 *
 * Styling (RMP-214): the foundation's neutral semantic tokens (--fg-2/3, --border,
 * --surface-raised, --font-serif/mono, …) are referenced via arbitrary-value
 * utility classes (`text-[color:var(--fg-3)]`), NOT inline `style` (the
 * no-`var(--)`-in-`style` rule). The teal accent rides the promoted `bg-brand` /
 * `text-accent-ink` tokens. The only surviving inline `style` is the wide-layout
 * container/panel sizing, which is driven by the runtime `bp` viewport value.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { useRecipe } from "./useRecipe";
import { useViewport, type Breakpoint } from "./useViewport";
import { TastePad, type PadDims } from "./TastePad";
import { RecipeInputs } from "./RecipeInputs";
import { PourSchedule } from "./PourSchedule";
import { BrewTimer } from "./BrewTimer";
import { Icon } from "./icons";
import { tasteKey } from "../../lib/four-six";

/** Section caption — uppercase micro-label. */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--fg-3)]";

/** Tabular mono numerals — keeps values from jittering as digits change. */
const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

type View = "idle" | "brew";

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

export function CoaCalculator() {
  const t = useTranslations("Calculator");
  const tTaste = useTranslations("Taste");
  const bp = useViewport();
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
  } = useRecipe();

  const [view, setView] = useState<View>("idle");

  const startBrew = () => {
    setView("brew");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
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
          "m-0 max-w-[17em] font-serif italic leading-[1.28] text-[color:var(--fg-2)]",
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
    <div className="mb-4 border-b border-[color:var(--border)] pb-[18px]">
      <div className={cn(CAP, "mb-2")}>{t("yourRecipe")}</div>
      <div className="flex items-end gap-[14px]">
        <span
          className={cn(
            "text-[44px] font-semibold leading-[0.9] tracking-[-0.02em] whitespace-nowrap text-accent-ink",
            MONO,
          )}
        >
          {recipe.waterG}
          <span className="text-[20px] text-[color:var(--fg-3)]">
            {" "}
            {t("grams")}
          </span>
        </span>
        <span className="pb-1 text-[13.5px] leading-[1.4] text-[color:var(--fg-2)]">
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
        className="mt-6 flex h-14 w-full gap-[10px] rounded-[var(--radius-md)] border-none bg-brand p-0 font-body text-[16px] font-semibold whitespace-normal text-white shadow-[var(--shadow-1)] hover:bg-brand has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-[18px]"
      >
        <Icon name="play" size={18} /> {t("beginBrew")}{" "}
        <span className={cn("opacity-[0.85]", MONO)}>{recipe.totalTime}</span>
      </Button>
      <div className="mt-4 text-center">
        <a
          href="https://en.philocoffea.com/blogs/blog/coffee-brewing-method"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[7px] text-[14px] text-[color:var(--fg-2)] no-underline"
        >
          <Icon name="book" size={15} color="var(--fg-3)" />
          <span className="underline decoration-[color:var(--border-strong)] underline-offset-[3px]">
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
            className="text-[color:var(--fg-3)]"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </>
  );

  if (view === "brew") {
    return (
      <BrewTimer
        recipe={recipe}
        onExit={() => setView("idle")}
        bp={bp}
        max={containerMax}
      />
    );
  }

  const panelClass = cn(
    "rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-raised)] shadow-[var(--shadow-1)]",
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
      <div className="mb-3">{pad}</div>
      <div className="mb-[22px]">{inputs}</div>
      {schedule}
      {cta}
    </main>
  );
}
