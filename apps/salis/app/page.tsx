"use client";

import { Button } from "@crivelo/ui/button";
import { content } from "./content";
import { toggleOwned, useDeviceStore } from "./device-store";

/**
 * Placeholder root route — a wiring smoke test, NOT a screen. Phase 2
 * (foundation): content module + device store + tokens.
 *
 * It proves three things and nothing else: the tokens resolve (both typefaces,
 * the mono "data" scale rendering tabular, a shared @crivelo/ui primitive
 * picking up Salis teal with no per-app config); the content imports as a
 * module; and the device store is genuinely shared — the two sections below are
 * separate `useDeviceStore()` consumers, and the button's write re-renders both
 * with no reload. That last one is the whole reason the store is a module-level
 * external store rather than a `useState` per mount.
 *
 * It is a client component only because the store is one. The real screens
 * (S0–S6) are built against the design handoff, not improvised here; delete this
 * page when S1 (Receitas) lands.
 */

/** pt-BR throughout: `1.000 mL`, never `1000`. */
const ptBR = new Intl.NumberFormat("pt-BR");

/** Ids are storage keys, not copy — the user only ever sees `label_pt`. */
const LABELS_PT = new Map(content.concentrates.map((c) => [c.id, c.label_pt]));

/** The concentrate the toggle writes, standing in for S5's inventory. */
const SAMPLE = content.concentrates[0];

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col gap-6 p-gutter">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-overline uppercase text-fg-3">fundação</p>
        <h1 className="text-h1 font-semibold text-fg">Salis</h1>
        <p className="text-body text-fg-2">
          Água mineralizada para café especial, em gotas.
        </p>
      </header>

      <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <p className="text-caption text-fg-3">Conteúdo carregado</p>
        <p className="font-mono text-data-sm text-fg-2">
          {ptBR.format(content.minerals.length)} sais ·{" "}
          {ptBR.format(content.concentrates.length)} concentrados ·{" "}
          {ptBR.format(content.recipes.length)} receitas
        </p>
        <p className="font-mono text-data-sm text-fg-2">
          versão {content.version}
        </p>
      </section>

      <DevicePrefs />
      <OwnedCount />

      <Button onClick={() => toggleOwned(SAMPLE.id)}>
        Alternar {SAMPLE.label_pt}
      </Button>
    </main>
  );
}

/** First store consumer. */
function DevicePrefs() {
  const { state, loaded } = useDeviceStore();

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-xs">
      <p className="text-caption text-fg-3">Preferências deste aparelho</p>
      {/* Tabular figures: the data scale must align digit-for-digit. */}
      <p className="font-mono text-data-lg font-medium text-brand">
        {ptBR.format(state.drops_per_ml)} gotas/mL
      </p>
      <p className="font-mono text-data-sm text-fg-2">
        água {ptBR.format(state.water_ml)} mL
      </p>
      <p className="font-mono text-data-sm text-fg-2" data-testid="owned-labels">
        concentrados:{" "}
        {state.owned_concentrate_ids.length > 0
          ? state.owned_concentrate_ids
              .map((id) => LABELS_PT.get(id) ?? id)
              .join(", ")
          : "nenhum"}
      </p>
      <p className="text-caption text-fg-3">
        {loaded ? "Lido do aparelho." : "Carregando…"}
      </p>
    </section>
  );
}

/**
 * Second store consumer, mounted beside the first — stands in for the inventory
 * badge the tab bar will carry. It never reads storage itself; it shares the
 * snapshot, so one write updates both sections at once.
 */
function OwnedCount() {
  const { state } = useDeviceStore();

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-xs">
      <p className="text-caption text-fg-3">Outro consumidor do mesmo estado</p>
      <p
        className="font-mono text-data-lg font-medium text-brand"
        data-testid="owned-count"
      >
        {ptBR.format(state.owned_concentrate_ids.length)} na estante
      </p>
    </section>
  );
}
