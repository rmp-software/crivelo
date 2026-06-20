import { ImageResponse } from "next/og";
import { splashDevices } from "./devices";
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

/**
 * Largest physical pixel dimension any device in the matrix can request (max of
 * cssW*dpr and cssH*dpr across splashDevices). Derived ONCE so the bound tracks
 * the matrix instead of a hardcoded magic number; bounds render requests to
 * plausible screen sizes (cheap DoS guard against arbitrary huge sizes).
 */
const MAX_DIMENSION = Math.max(
  ...splashDevices.flatMap((d) => [d.cssW * d.dpr, d.cssH * d.dpr])
);

/** Physical-pixel size param, e.g. "1206x2622". */
const SIZE_RE = /^(\d{2,5})x(\d{2,5})$/;

/**
 * Build the App-Router `GET` handler for an app's `pwa-splash/[size]` route from
 * its PwaConfig. This is the NextAuth-style factory: the package owns ALL the
 * route logic (size parsing + bounds guard + render); the app's route file just
 * wires its config. It mirrors the renderIcon → pwa-icon/[variant]/route.tsx
 * split — `renderSplash` is the pure renderer, this is the request plumbing —
 * so the per-app wrapper carries no duplicated boilerplate.
 *
 * The app still declares `export const runtime = "nodejs"` itself: Next requires
 * the runtime export to be a STATIC LITERAL it can read at build time from the
 * route module, so it cannot be returned from (or re-exported through) this
 * factory — only the handler can.
 */
export function createSplashRoute(cfg: PwaConfig): {
  GET: (
    req: Request,
    ctx: { params: Promise<{ size: string }> }
  ) => Promise<Response>;
} {
  async function GET(
    _req: Request,
    ctx: { params: Promise<{ size: string }> }
  ): Promise<Response> {
    const { size } = await ctx.params;

    const match = SIZE_RE.exec(size);
    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return new Response("Not found", { status: 404 });
    }

    // ImageResponse extends Response — return it directly.
    return renderSplash(cfg, { width, height });
  }

  return { GET };
}
