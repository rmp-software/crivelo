import { notFound } from "next/navigation";
import { cn } from "@crivelo/ui/lib/utils";
import { content } from "../../content";
import { TopBar } from "../../top-bar";
import {
  formatGrams,
  formatWhole,
  parseFormula,
  parseSteps,
} from "./prep-content";
import { PrepStatus } from "./prep-status";

/**
 * S4 · Concentrado — Juliana's fixed prep recipe for one bottle.
 *
 * The screen that unblocks everything else: a student with no concentrates can
 * make no water, and a dimmed recipe row routes here rather than hiding the
 * recipe (`docs/01-v1-plan.md` § Screens).
 *
 * A Server Component but for `PrepStatus`. Grams, mL, steps, label text and
 * shelf life are all Juliana's content — identical on every device — so the only
 * thing shipped as client JS is the ownership gesture. The weighing checklist
 * needs no JS at all: see `ChecklistItem`.
 *
 * NUMBERS COME FROM HER SHEET, NEVER FROM A DERIVATION HERE. One deliberate
 * omission: the wireframe's header line reads "Rende 500 mL · 30.000 ppm HCO₃",
 * and the ppm half is exactly what `label_pt` encodes ("KHCO3 30.000"), so it is
 * rendered there and nowhere else. Printing `ion_mg_per_ml × 1000` next to it
 * instead would read "29.925 ppm" for `nahco3-30k` — true to four digits, and
 * contradicting the number on the bottle the same screen just told the student
 * to write. One concentration, one source: her label.
 */
export default async function ConcentradoPage({
  params,
}: {
  params: Promise<{ concentrateId: string }>;
}) {
  const { concentrateId } = await params;
  const concentrate = content.concentrates.find(
    (item) => item.id === concentrateId,
  );
  if (!concentrate) {
    notFound();
  }

  // The importer rejects a concentrate whose mineral_id does not resolve, so
  // this is unreachable with a valid content.json — but a 404 is the honest
  // answer either way, and it keeps the mineral non-nullable below.
  const mineral = content.minerals.find(
    (item) => item.id === concentrate.mineral_id,
  );
  if (!mineral) {
    notFound();
  }

  const steps = parseSteps(concentrate.steps_pt);
  const recipeCount = content.recipes.filter((recipe) =>
    recipe.concentrate_ids.includes(concentrate.id),
  ).length;

  return (
    <>
      <TopBar
        title="Preparar concentrado"
        subtitle={concentrate.label_pt}
        backHref="/concentrados"
      />
      <div className="flex flex-col gap-6 px-gutter pt-2 pb-8">
        <section className="flex flex-col gap-1.5">
          <Formula
            formula={mineral.formula}
            className="text-data-xl font-medium text-fg"
          />
          {/* Not a heading: the screen's <h1> is in the top bar, which already
              carries `label_pt` as its subtitle. This is the subject, printed
              the way the handoff prints it — formula large, name under it. */}
          <p className="text-h3 text-fg-2">{mineral.name_pt}</p>
          <p className="text-body text-fg-2">{mineral.sensory_note}</p>
          {recipeCount > 0 && (
            <p className="text-body-sm text-fg-3">
              {recipeCount === 1
                ? "Usado em 1 receita."
                : `Usado em ${formatWhole(recipeCount)} receitas.`}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h3 font-semibold text-fg">Você vai precisar</h2>
          {/* The one uppercase in the system: a mono, tracked overline. */}
          <p className="font-mono text-overline uppercase text-fg-3">
            Rende {formatWhole(concentrate.water_ml)} mL
          </p>
          {/* A plain <ul>, not the shared Card: Card is a `rounded-xl py-6
              gap-6 shadow-sm` <div>, so matching the handoff's card (radius 14,
              padding 16, shadow-xs) would mean neutralising four of its classes
              and losing the list semantics the checklist needs. */}
          <ul className="divide-y divide-divider rounded-lg border border-border bg-surface shadow-xs">
            <ChecklistItem
              quantity={`${formatGrams(concentrate.salt_g)} g`}
              label={mineral.name_pt}
            />
            <ChecklistItem
              quantity={`${formatWhole(concentrate.water_ml)} mL`}
              label="Água destilada ou de osmose reversa"
            />
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h3 font-semibold text-fg">Passo a passo</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-xs bg-brand-soft font-mono text-data-xs font-medium text-brand-soft-ink">
                  {index + 1}
                </span>
                <span className="text-body text-fg">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <PrepStatus
          concentrateId={concentrate.id}
          labelPt={concentrate.label_pt}
          shelfLifeDays={concentrate.shelf_life_days}
          storageNote={concentrate.storage_note}
        />

        {/* Only when Juliana filled the column — the app never invents a shop. */}
        {mineral.buy_url && (
          <a
            href={mineral.buy_url}
            target="_blank"
            rel="noreferrer"
            className="text-body text-link underline-offset-4 hover:underline"
          >
            Onde comprar
          </a>
        )}
      </div>
    </>
  );
}

/**
 * One line of the weighing checklist.
 *
 * Uncontrolled and stateless on purpose: a native `<input type="checkbox">`
 * already holds "ticked" for the life of the screen, which is exactly the scope
 * the plan asks for, and `peer-checked:` paints the box in CSS. So the checklist
 * ships zero bytes of JavaScript and keeps the keyboard, the screen reader and
 * the browser's own hit-slop for free.
 *
 * The `<label>` is the tap target, not the box: at `min-h-tap-min` the whole
 * row — quantity and name included — toggles the item, which is what makes this
 * usable with a wet finger.
 */
function ChecklistItem({
  quantity,
  label,
}: {
  quantity: string;
  label: string;
}) {
  return (
    <li>
      <label className="flex min-h-tap-min cursor-pointer items-center gap-3 px-4 py-2.5">
        <input type="checkbox" className="peer sr-only" />
        {/*
          The handoff's Checkbox: a 22 px box (size-5.5 — 5.5 × 4 px, an exact
          step), radius 4, and a 1.5 px rule that is NOT on Tailwind's border
          scale, hence the arbitrary. Mineral blue when ticked, per the token
          rule that blue is the interactive hue.

          outline-solid is load-bearing on the focus ring — see the note in
          `app/top-bar.tsx`. The ring hangs off the hidden input's
          `:focus-visible`, since that is the element that actually takes focus.
        */}
        <span className="grid size-5.5 shrink-0 place-items-center rounded-xs border-[1.5px] border-border-strong bg-surface text-fg-inverse transition-colors peer-checked:border-mineral peer-checked:bg-mineral peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring">
          <CheckGlyph />
        </span>
        {/* shrink-0 + whitespace-nowrap: the quantity is the one thing on this
            row that must never break. Without them the flex row lets a long
            mineral name squeeze it, and "76,1 g" wraps to "76,1" / "g" — which
            happened to hit Mg 30.000 specifically, the longest name of the five
            and the exact bottle onboarding sends every new student to first. */}
        <span className="shrink-0 whitespace-nowrap font-mono text-data-md text-fg">
          {quantity}
        </span>
        <span className="text-body text-fg-2">{label}</span>
      </label>
    </li>
  );
}

/**
 * Lucide `check`, inlined.
 *
 * Not added to `app/icons.tsx`: that map is the navigation frame's four glyphs
 * and is shared with screens other sub-issues own. Decorative — the `<label>`
 * text names the item and the input carries the checked state.
 */
function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 opacity-0 transition-opacity"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * A chemistry formula with REAL subscripts.
 *
 * `<sub>` elements, never the Unicode subscript block: the handoff's
 * `components/data/Formula.jsx` is explicit about it, and `MgSO₄·7H₂O` typed in
 * Unicode would also fall outside the latin woff2 subsets `@salis/tokens` loads.
 * Always mono — a formula is lab data.
 *
 * LOCAL BY NECESSITY, not by design: S2 and S3 render formulas too, so this
 * belongs one level up next to `top-bar.tsx` once a single sub-issue owns that
 * file. See the report for RMP-255.
 */
function Formula({
  formula,
  className,
}: {
  formula: string;
  className?: string;
}) {
  return (
    <span className={cn("font-mono whitespace-nowrap", className)}>
      {parseFormula(formula).map((token, index) => {
        if (token.kind === "dot") {
          return (
            // fg-3, not fg-4: the handoff paints the hydrate dot
            // --text-tertiary (slate-500), which maps to --fg-3. fg-4 is
            // slate-300, a step lighter than the design calls for.
            <span key={index} className="text-fg-3">
              {" · "}
            </span>
          );
        }
        if (token.kind === "sub") {
          // The handoff's subscript metrics. All three are off every Tailwind
          // scale: a subscript is sized relative to its own text, and the zero
          // line-height is what stops it from growing the line box.
          return (
            <sub key={index} className="text-[0.68em] leading-[0] align-[-0.28em]">
              {token.text}
            </sub>
          );
        }
        return <span key={index}>{token.text}</span>;
      })}
    </span>
  );
}
