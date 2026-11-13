"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDeviceStore } from "./device-store";

/**
 * `/` is not a screen — it is the one decision the app makes before showing
 * anything: has this student been through onboarding?
 *
 * Receitas is the home tab, but it owns `/receitas` rather than `/` so that its
 * pushed screens nest under it (`/receitas/[recipeId]`) and the tab bar's
 * visibility can be read off the path alone — see `isRootTabPath` in
 * `app/tabs.ts`. A tab at `/` would have no segment to nest under and would make
 * "is this a root tab?" a special case.
 *
 * **Client-side, necessarily.** `onboarding_done` lives in `localStorage`, which
 * the server cannot read, so this cannot stay a server `redirect()` — a server
 * redirect has to guess, and guessing sends a first-time student straight past
 * onboarding or a returning one back through it. The gate therefore renders
 * NOTHING until the store reports `loaded` (the hydration render still holds the
 * server defaults, where `onboarding_done` is `false` for everyone), and only
 * then routes. Nothing is painted in the meantime, so no screen flashes before
 * the right one.
 *
 * `replace`, not `push`: `/` is a decision, not a step a back gesture should
 * return to.
 *
 * **It degrades instead of dying.** A gate that paints nothing is a blank page
 * for anyone whose JS never arrives — scripts disabled, or a bundle that failed
 * on a bad connection — and this is an offline-first PWA, so a dead root route
 * is the one regression a client gate can introduce over the server `redirect()`
 * it replaced. The `<noscript>` below ships in the server HTML and gives that
 * visitor the two real destinations as plain anchors. Browsers with JS ignore
 * it, so the client gate above remains the only path anyone normally takes.
 *
 * NOTE for RMP-259 (PWA): point the manifest's `start_url` at `/` so a
 * standalone launch runs this gate — a fresh install has to land in onboarding,
 * and `/receitas` as `start_url` would skip it.
 */
export default function Page() {
  const router = useRouter();
  const { state, loaded } = useDeviceStore();

  useEffect(() => {
    if (!loaded) return;
    router.replace(state.onboarding_done ? "/receitas" : "/onboarding");
  }, [loaded, state.onboarding_done, router]);

  return (
    <noscript>
      <div className="flex flex-col gap-4 px-gutter py-8">
        <h1 className="text-h1 font-semibold text-fg">Salis</h1>
        <p className="text-body text-fg-2">
          Esta tela precisa de JavaScript para saber onde você parou. Siga por
          um destes caminhos.
        </p>
        <a href="/onboarding" className="text-body">
          Primeira vez por aqui
        </a>
        <a href="/receitas" className="text-body">
          Ver as receitas
        </a>
      </div>
    </noscript>
  );
}
