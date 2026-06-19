import { ImageResponse } from "next/og";
import type { PwaConfig } from "./index";

export interface RenderSplashOptions {
  /** Image width in PHYSICAL pixels (cssW*dpr or cssH*dpr). */
  width: number;
  /** Image height in PHYSICAL pixels. */
  height: number;
}

/**
 * Render a single iOS launch image (apple-touch-startup-image): the brand mark
 * (markColor) centred on a solid background filling width × height PHYSICAL
 * pixels, via next/og. Backs the app's pwa-splash/[size] route. Mirrors
 * renderIcon, but the canvas is a full-screen rectangle (not a square tile) and
 * the mark is scaled to the SHORTER edge (markScale ≈ 0.22) so it reads
 * consistently across phone and tablet aspect ratios and both orientations.
 *
 * Background defaults to cfg.splash?.background ?? cfg.themeColor; mark colour to
 * cfg.splash?.markColor ?? cfg.markColor ?? "#ffffff" — all overridable via the
 * optional `splash` config block.
 */
export function renderSplash(cfg: PwaConfig, opts: RenderSplashOptions): ImageResponse {
  const { width, height } = opts;
  const markScale = cfg.splash?.markScale ?? 0.22;
  const background = cfg.splash?.background ?? cfg.themeColor;
  const markColor = cfg.splash?.markColor ?? cfg.markColor ?? "#ffffff";
  const markSize = Math.round(Math.min(width, height) * markScale);

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cfg.mark({ size: markSize, color: markColor })}
      </div>
    ),
    { width, height }
  );
}
