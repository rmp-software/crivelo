"use client";

import { useState } from "react";
import { Button } from "@crivelo/ui/button";
import { markPrepared, useDeviceStore } from "../../device-store";
import { formatBrDate, formatWhole } from "./prep-content";

/**
 * The bottom of S4: the text to write on the bottle, how long it keeps, and the
 * one gesture that puts the concentrate on the shelf.
 *
 * The only client island on the screen. Everything above it — the formula, the
 * weighing checklist, the steps — is content that never changes per device, so
 * it stays in the Server Component; ownership is the one thing that is read
 * from (and written to) this device.
 *
 * **`markPrepared`, not `toggleOwned` + `setPreparedOn`.** Tapping "Tenho este
 * concentrado" means two fields — ownership AND today's prep date — and the
 * store exposes them as one action precisely so the pair cannot be committed
 * half-way. The prep date is what RMP-256's shelf-life warning counts from, so
 * an ownership write without one leaves a bottle nobody can date.
 *
 * **The label date is never computed here.** Before the user taps, the label
 * slot says what to write (`data de preparo`); afterwards it shows the date the
 * store recorded. So there is no second "today" in the codebase to drift from
 * the store's, and no server-rendered date to mismatch on hydration.
 */
export function PrepStatus({
  concentrateId,
  labelPt,
  shelfLifeDays,
  storageNote,
}: {
  concentrateId: string;
  /** Juliana's bottle label, verbatim — e.g. `KHCO3 30.000`. */
  labelPt: string;
  shelfLifeDays: number;
  storageNote: string;
}) {
  const { state, loaded } = useDeviceStore();
  const [saveFailed, setSaveFailed] = useState(false);

  const owned = state.owned_concentrate_ids.includes(concentrateId);
  // Possible to own a concentrate with no date: S0 can seed an inventory without
  // one. Then the label keeps its instruction rather than printing nothing.
  const preparedOn = state.prepared_on[concentrateId];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 font-semibold text-fg">Etiqueta</h2>
      <p className="text-body-sm text-fg-2">
        Escreva isto no frasco. O nome tem que ser o mesmo que aparece nas
        receitas.
      </p>
      {/* Dashed, sunken and mono: a label waiting to be written on, and the
          bottle text is a quantity, so it is mono like every other number. */}
      <p className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-dashed border-border-strong bg-surface-sunken px-3 py-2.5">
        {/* label_pt renders VERBATIM, deliberately — it is not run through
            <Formula>, so "KHCO3" here stays unsubscripted while the hero
            formula above shows "KHCO₃". That looks inconsistent but is right:
            docs/03 defines label_pt as "what the student writes on the bottle",
            and nobody handwrites a subscript. Subscripting it would also
            mangle the "30.000" that shares the string. If Juliana wants them
            to match, the fix is splitting label_pt into formula + strength at
            import time, not formatting it here. */}
        <span className="font-mono text-data-md text-fg">{labelPt}</span>
        <span aria-hidden className="text-fg-4">
          ·
        </span>
        {preparedOn ? (
          <span className="font-mono text-data-md text-fg">
            {formatBrDate(preparedOn)}
          </span>
        ) : (
          <span className="text-body-sm text-fg-3">data de preparo</span>
        )}
      </p>

      <p className="text-body-sm text-fg-2">
        Validade de{" "}
        <span className="font-mono text-data-sm text-fg">
          {formatWhole(shelfLifeDays)} dias
        </span>{" "}
        a partir do preparo. {storageNote}
      </p>

      {/* `loaded` is false on the hydration render, where the store still holds
          the server defaults — rendering the action then would offer "Tenho este
          concentrado" for a frame to someone who already has it. The reserved
          height keeps the swap from shifting the page. */}
      {!loaded ? (
        <div aria-hidden className="h-tap-min" />
      ) : owned ? (
        <p className="flex min-h-tap-min items-center rounded-md bg-success-soft px-4 text-body text-success-ink">
          {preparedOn
            ? `Você preparou este concentrado em ${formatBrDate(preparedOn)}.`
            : "Você tem este concentrado."}
        </p>
      ) : (
        <Button
          size="lg"
          // h-tap-min: the shared Button's `lg` is 40 px and this screen is used
          // with wet hands — the handoff's floor is 44.
          className="h-tap-min w-full text-body"
          onClick={() => setSaveFailed(!markPrepared(concentrateId))}
        >
          Tenho este concentrado
        </Button>
      )}

      {saveFailed && (
        <p role="status" className="text-body-sm text-danger">
          Não foi possível salvar no aparelho. Marque de novo na próxima
          abertura.
        </p>
      )}
    </section>
  );
}
