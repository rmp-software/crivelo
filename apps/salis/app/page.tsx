import { redirect } from "next/navigation";

/**
 * `/` is not a screen.
 *
 * Receitas is the home tab, but it owns `/receitas` rather than `/` so that its
 * pushed screens nest under it (`/receitas/[recipeId]`) and the tab bar's
 * visibility can be read off the path alone — see `isRootTabPath` in
 * `app/tabs.ts`. A tab at `/` would have no segment to nest under and would make
 * "is this a root tab?" a special case.
 *
 * NOTE for RMP-259 (PWA): point the manifest's `start_url` at `/receitas`, so a
 * standalone launch does not depend on this redirect being cached.
 *
 * NOTE for RMP-252 (onboarding): this unconditional server redirect is the
 * whole of `/` only while there is nothing to decide. Onboarding adds one —
 * "has this student calibrated their dropper?" — and the answer lives in
 * localStorage, which the server cannot read. So `/` becomes either a client
 * component that gates the choice after mount, or it stops being the entry
 * point and `start_url` moves straight to a screen. Either way this file
 * changes shape; it is not a permanent redirect.
 */
export default function Page() {
  redirect("/receitas");
}
