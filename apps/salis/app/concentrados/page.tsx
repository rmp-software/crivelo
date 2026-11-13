import { TopBar } from "../top-bar";
import { Inventory } from "./inventory";

/**
 * S5 · Concentrados — the inventory tab (`docs/01-v1-plan.md` § Screens).
 *
 * The screen stays a Server Component: the header is static and the shelf is
 * the only part that reads device state, so the `"use client"` boundary sits
 * one level down in `Inventory` — the same split as S1's `RecipeList`.
 */
export default function ConcentradosPage() {
  return (
    <>
      <TopBar
        title="Concentrados"
        subtitle="O que você já preparou e o que ainda falta."
      />
      <Inventory />
    </>
  );
}
