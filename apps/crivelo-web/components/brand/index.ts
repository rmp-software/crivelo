/**
 * Brand marks for crivelo-web (RMP-189).
 *
 * Presentational, server-safe SVG components (no hooks/state) ported from
 * docs/design/coa-v60/project/coa-shared.jsx:
 *  - Monogram      — 5×5 sieve, kept dots form a "C" (HOUSE mark, neutral ink)
 *  - CoaMark       — V60 pour-over cone + drip (TOOL mark, teal accent)
 *  - CriveloLockup — Monogram + "Crivelo" wordmark (house, shell chrome)
 *  - CoaLockup     — CoaMark + "Coa · by Crivelo" endorsement (header)
 *  - SieveGrid     — parametric dot grid (puck neighbourhood / row-major fill)
 */
export { Monogram } from "./Monogram";
export type { MonogramProps } from "./Monogram";

export { CoaMark } from "./CoaMark";
export type { CoaMarkProps } from "./CoaMark";

export { CriveloLockup } from "./CriveloLockup";
export type {
  CriveloLockupProps,
  LockupSize,
  LockupVariant,
} from "./CriveloLockup";

export { CoaLockup } from "./CoaLockup";
export type {
  CoaLockupProps,
  CoaLockupSize,
  CoaLockupVariant,
} from "./CoaLockup";

export { SieveGrid } from "./SieveGrid";
export type { SieveGridProps } from "./SieveGrid";
