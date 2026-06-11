import type { PwaConfig } from "@crivelo/pwa";

/**
 * Crivelo website PWA config (RMP / pwa-add-to-home-screen). The single source
 * of truth for crivelo-web's manifest + icon tiles, consumed by app/manifest.ts,
 * app/icon.tsx, app/apple-icon.tsx and app/pwa-icon/[variant]/route.tsx.
 *
 * This app is the **Crivelo hub/website** (Coa is one tool *within* it), so the
 * installed app is branded "Crivelo" with the HOUSE mark — the Monogram sieve —
 * NOT the Coa tool's V60 cone.
 *
 * Colours are literal hex (NOT var(--...)) because next/og's Satori can't
 * resolve CSS variables: teal #1C6E68 is the site accent (--brand) and crema
 * #FBF6EA is the page background (--bg / --crema-50). Strings use the default
 * locale (en) — "Crivelo" is a proper noun and never translated.
 */

// The Crivelo house mark: a 5×5 sieve whose solid dots spell a "C". Inlined from
// components/brand/Monogram.tsx so the glyph carries concrete colours for Satori.
// Rendered white on the teal tile (solid dots opaque, sieve apertures faint).
//
// Note: the full 5×5 grid is centred in the viewBox, but the *solid* "C" sits in
// columns 0–3 with the faint aperture column on the right — so the bright mark
// reads slightly left-of-centre. That is the Monogram's intrinsic letterform
// (the open-right "C"), not a centring bug — don't "fix" it by shifting the grid.
const SIEVE_GRID = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 1, 1, 0],
];
const SIEVE_AXIS = [8, 20, 32, 44, 56];

function CriveloMonogram({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {SIEVE_GRID.flatMap((row, r) =>
        row.map((on, k) => (
          <circle
            key={`${r}-${k}`}
            cx={SIEVE_AXIS[k]}
            cy={SIEVE_AXIS[r]}
            r={on ? 4 : 2}
            fill={color}
            opacity={on ? 1 : 0.16}
          />
        ))
      )}
    </svg>
  );
}

export const criveloPwa: PwaConfig = {
  name: "Crivelo",
  description: "Tools for people who live coffee.",
  lang: "en",
  themeColor: "#1C6E68",
  backgroundColor: "#FBF6EA",
  // The sieve grid spans the full viewBox, so give it a touch more room than the
  // default single-glyph scale while staying inside the maskable safe zone.
  iconScale: 0.62,
  mark: ({ size, color }) => <CriveloMonogram size={size} color={color} />,
};
