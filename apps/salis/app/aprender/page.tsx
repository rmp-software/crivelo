import { TopBar } from "../top-bar";

/**
 * Aprender — Juliana's lessons as a tab.
 *
 * PLACEHOLDER BODY: RMP-265 builds the real lesson list from `content.lessons`.
 */
export default function AprenderPage() {
  return (
    <>
      <TopBar title="Aprender" subtitle="As aulas da Juliana, em texto curto." />
      <div className="px-gutter pb-6">
        <p className="text-body text-fg-2">As aulas aparecem aqui.</p>
      </div>
    </>
  );
}
