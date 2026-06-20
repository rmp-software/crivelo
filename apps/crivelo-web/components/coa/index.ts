/**
 * Coa calculator (RMP-191) — the idle 4:6 calculator.
 *
 * Client components composing lib/four-six.ts (the math is never reimplemented):
 *  - CoaCalculator — homepage body; owns the idle ↔ brew view state + responsive layout
 *  - TastePad      — 2D taste pad (free puck, acidity continuous, strength rounds 1–4)
 *  - RecipeInputs  — Coffee / Ratio steppers + (mobile) live Water total
 *  - PourSchedule  — phase bar + pour list + "Remove dripper · drawdown" row
 *  - BrewTimer     — RMP-192 running brew timer (live dial, real-time + localStorage resume)
 *  - useRecipe     — recipe state over the engine
 *  - useViewport   — mobile <700 / tablet 700–1023 / desktop ≥1024
 */
export { CoaCalculator } from "./CoaCalculator";
export type { CoaCalculatorProps } from "./CoaCalculator";
export { LastBrewCard } from "./LastBrewCard";
export { TastePad } from "./TastePad";
export type { TastePadProps, PadDims } from "./TastePad";
export { RecipeInputs } from "./RecipeInputs";
export type { RecipeInputsProps } from "./RecipeInputs";
export { PourSchedule } from "./PourSchedule";
export type { PourScheduleProps } from "./PourSchedule";
export { BrewTimer } from "./BrewTimer";
export type { BrewTimerProps } from "./BrewTimer";
export { BrewView } from "./BrewView";
export { useRecipe } from "./useRecipe";
export type { UseRecipe, RecipeInit } from "./useRecipe";
export { useViewport } from "./useViewport";
export type { Breakpoint } from "./useViewport";
export { CAP, MONO } from "./style-tokens";
