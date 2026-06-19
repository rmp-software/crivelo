/**
 * Selectable multipliers for the dev-only brew speed panel. Kept in its own tiny
 * module so `BrewTimer` can share the constant without importing the panel
 * component (which is code-split via `next/dynamic` to stay out of the prod
 * bundle). `1` is the real-time default; the rest accelerate the brew clock.
 */
export const BREW_SPEEDS = [1, 10, 30, 60] as const;

export type BrewSpeed = (typeof BREW_SPEEDS)[number];

/** Narrow an arbitrary number to a known BrewSpeed, falling back to real time. */
export function toBrewSpeed(value: number): BrewSpeed {
  return (BREW_SPEEDS as readonly number[]).includes(value)
    ? (value as BrewSpeed)
    : 1;
}
