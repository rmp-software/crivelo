import { ImageResponse } from "next/og";
import type { PwaConfig } from "./index";

export interface RenderIconOptions {
  /** Tile size in px (square). */
  size: number;
  /** Apply the rounded-square corner (radiusScale). Browser/Android tiles. */
  rounded?: boolean;
  /** Full-bleed tile, no corner radius — for iOS apple-icon and maskable. */
  maskable?: boolean;
}

/**
 * Render a single PWA icon tile: the brand glyph (markColor) centred on a solid
 * themeColor square, via next/og. Backs the app's icon.tsx / apple-icon.tsx /
 * pwa-icon[variant] files. `rounded` adds a corner radius; `maskable` keeps the
 * tile full-bleed so platform masks can crop it without clipping the glyph,
 * which stays within the safe zone by virtue of iconScale (≈0.54).
 */
export function renderIcon(cfg: PwaConfig, opts: RenderIconOptions): ImageResponse {
  const { size } = opts;
  const iconScale = cfg.iconScale ?? 0.54;
  const radiusScale = cfg.radiusScale ?? 0.29;
  const glyphSize = Math.round(size * iconScale);
  const borderRadius = opts.rounded ? Math.round(size * radiusScale) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          background: cfg.themeColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cfg.mark({ size: glyphSize, color: cfg.markColor ?? "#ffffff" })}
      </div>
    ),
    { width: size, height: size }
  );
}
