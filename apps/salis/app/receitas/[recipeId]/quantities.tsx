/**
 * A warning sentence, with its quantities set in mono.
 *
 * "Mono type marks quantities" is a house rule, and inside a dose row's note
 * band it is load-bearing rather than decorative: the numbers in those sentences
 * are functions of the water volume and the device's calibration, so
 * proportional digits change the line's width — and move the `truncate`
 * ellipsis — on every press of +. Marking them mechanically is what lets
 * `./warnings.ts` stay plain pt-BR strings: Juliana reviews sentences, and a
 * sentence spliced into JSX spans is not one.
 *
 * The splitting is `splitQuantities` (`./format.ts`), which interleaves
 * literals and quantities so the odd indices are exactly the quantities — it
 * lives there, with its own tests, because the node test environment has no
 * renderer to pull this component into.
 *
 * **Its own module because BOTH warning surfaces need it.** S2 renders the
 * recipe-scoped list and the dose rows' note bands (`./recipe-counter.tsx`) and
 * S3 renders the row-scoped band on its tiles (`./preparo/prep-mode.tsx`). The
 * alternative — S3 importing this out of `recipe-counter.tsx` — would pull S2's
 * whole module graph (sheet, toggle group, shelf life, prep content) into modo
 * preparo's chunk for twelve lines of JSX, on the one app whose first
 * requirement is working offline on a phone.
 */
import { splitQuantities } from "./format";

export function Quantities({ text }: { text: string }) {
  return (
    <>
      {splitQuantities(text).map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : (
          <span key={index} className="font-mono">
            {part}
          </span>
        ),
      )}
    </>
  );
}
