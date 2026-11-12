import { Button } from "@crivelo/ui/button";

/**
 * Placeholder root route — a token smoke test, NOT a screen.
 *
 * Phase 1 of the build order ships the content pipeline and the pure dosing
 * engine with **no UI at all**; the real screens (S0–S6) are Phase 2 and must be
 * built against the design handoff, not improvised here. This page exists only
 * to prove the stack is wired: both typefaces load, the mono "data" scale
 * renders tabular, the Salis semantic tokens resolve, and a shared @crivelo/ui
 * shadcn primitive picks up Salis teal with no per-app config.
 *
 * Delete it when S1 (Receitas) lands.
 */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col gap-6 p-gutter">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-overline uppercase text-fg-3">
          Phase 1 · motor
        </p>
        <h1 className="text-h1 font-semibold text-fg">Salis</h1>
        <p className="text-body text-fg-2">
          Água mineralizada para café especial, em gotas.
        </p>
      </header>

      <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <p className="text-caption text-fg-3">
          Smoke test: mono tabular + escala de dados
        </p>
        {/* Tabular figures: these two rows must align digit-for-digit. */}
        <p className="font-mono text-data-lg font-medium text-brand">10 gotas</p>
        <p className="font-mono text-data-lg font-medium text-brand">17 gotas</p>
        <p className="font-mono text-data-sm text-fg-2">GH 124 · KH 25</p>
      </section>

      <Button>Botão compartilhado</Button>
    </main>
  );
}
