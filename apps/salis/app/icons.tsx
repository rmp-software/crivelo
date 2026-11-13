/**
 * The app chrome's icon set.
 *
 * The four glyphs the navigation frame needs, copied from the design handoff
 * (`.design/project/assets/icons`, Lucide outline via lucide-static 0.460.0,
 * ISC). Inlined as a path map rather than pulled from a package, mirroring
 * `apps/crivelo-web/components/shell/icons.tsx`: the handoff is the authority on
 * which glyphs the brand uses, and a four-entry map needs no dependency.
 *
 * Handoff iconography rules: 24-grid, `currentColor`, round caps and joins,
 * stroke 1.75 (2 on the active tab). Decorative here in every use — the tab
 * links and the back control carry their own accessible names — so the `<svg>`
 * is always `aria-hidden`.
 */
import type { ReactNode } from "react";

const PATHS = {
  droplets: (
    <>
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </>
  ),
  "flask-conical": (
    <>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </>
  ),
  "graduation-cap": (
    <>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </>
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 24,
  stroke = 1.75,
}: {
  name: IconName;
  /** Rendered box, px. Bars use 24, the back control 22. */
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block shrink-0"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
