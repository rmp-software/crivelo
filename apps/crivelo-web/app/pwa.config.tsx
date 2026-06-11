import type { PwaConfig } from "@crivelo/pwa";

/**
 * Coa hub PWA config (RMP / pwa-add-to-home-screen). The single source of truth
 * for crivelo-web's manifest + icon tiles, consumed by app/manifest.ts,
 * app/icon.tsx, app/apple-icon.tsx and app/pwa-icon/[variant]/route.tsx.
 *
 * Colours are literal hex (NOT var(--brand)) because next/og's Satori can't
 * resolve CSS variables: teal #1C6E68 is the site accent (--brand) and crema
 * #FBF6EA is the page background (--bg / --crema-50). Strings use the default
 * locale (en) — "Coa" is a proper noun and never translated.
 */

// The Coa tool mark: a V60 pour-over cone (inverted triangle + converging ribs
// + drip). Inlined from components/brand/CoaMark.tsx so the glyph carries
// concrete colours for Satori. Rendered white on the teal tile.
function CoaCone({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 14.5 L51 14.5 L32 47 Z"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 14.5 L32 47 M40 14.5 L32 47"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M32 50.5 C 28.6 54, 28.6 58.2, 32 58.2 C 35.4 58.2, 35.4 54, 32 50.5 Z"
        fill={color}
      />
    </svg>
  );
}

export const coaPwa: PwaConfig = {
  name: "Coa",
  description: "Tools for people who live coffee.",
  lang: "en",
  themeColor: "#1C6E68",
  backgroundColor: "#FBF6EA",
  mark: ({ size, color }) => <CoaCone size={size} color={color} />,
};
