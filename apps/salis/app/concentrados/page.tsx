import { TopBar } from "../top-bar";

/**
 * S5 · Concentrados — the inventory tab.
 *
 * PLACEHOLDER BODY: RMP-256 builds the real shelf (what the student has, prep
 * dates and shelf life, what each missing one unlocks).
 */
export default function ConcentradosPage() {
  return (
    <>
      <TopBar
        title="Concentrados"
        subtitle="Marque os que você já preparou."
      />
      <div className="px-gutter pb-6">
        <p className="text-body text-fg-2">
          A sua estante de concentrados aparece aqui.
        </p>
      </div>
    </>
  );
}
