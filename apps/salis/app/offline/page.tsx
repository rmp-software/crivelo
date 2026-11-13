import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@crivelo/ui/button";
import { TopBar } from "../top-bar";

/**
 * The offline navigation fallback, precached at /offline and served by the
 * service worker when a document request fails with no cache entry.
 *
 * WHY THE COPY IS NOT "you are offline": Salis works offline. Every screen the
 * student has opened — and the whole dosing engine, which is pure client-side
 * arithmetic over precached content JSON — keeps working with the network down.
 * So reaching this page does NOT mean "the app is unavailable"; it means this one
 * route was never cached. The useful thing to say is therefore what still works
 * and how to get back to it, not that the connection dropped.
 *
 * It must stay a static Server Component with no data access: the build
 * prerenders it and `createCriveloSerwistRoute` precaches that HTML, so anything
 * dynamic here would either break the prerender or ship a shell the SW cannot
 * fill offline. It is also reached cold, with no tab bar (see `isRootTabPath`),
 * which is why the way out is an explicit link rather than the bar.
 */
export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <>
      <TopBar
        title="Esta tela não está salva"
        subtitle="Você está sem conexão e esta tela ainda não foi baixada."
      />
      <div className="flex flex-col items-start gap-5 px-gutter pb-6">
        <p className="text-pretty text-body text-fg-2">
          Salis funciona sem internet depois do primeiro acesso. As receitas e os
          concentrados que você já abriu continuam disponíveis.
        </p>
        <Button
          asChild
          size="lg"
          // h-tap-min: the shared Button's `lg` is 40 px and this screen is the
          // way back into the app on a flaky connection — the handoff's floor
          // is 44.
          className="h-tap-min"
        >
          <Link href="/receitas" className="no-underline">
            Ir para as receitas
          </Link>
        </Button>
        <p className="text-pretty text-body-sm text-fg-3">
          Quando a conexão voltar, abra esta tela uma vez para ela ficar salva no
          aparelho.
        </p>
      </div>
    </>
  );
}
