import type { Metadata, Viewport } from "next";
import type { PwaConfig } from "./index";
import { DEFAULT_SPLASH_BASE_PATH, splashDevices } from "./devices";

/** The object form of next's `AppleImage` used for startup-image link tags. */
type AppleImage = { url: string; media: string };

/**
 * iOS `apple-touch-startup-image` link tags, two per device geometry. The media
 * query is keyed on the portrait logical points (device-width/-height stay the
 * portrait values for BOTH orientations — iOS reports logical dims unrotated);
 * only the URL's physical pixel dims swap and the `orientation` keyword changes,
 * so the route renders each splash at native resolution.
 */
function startupImages(cfg: PwaConfig): AppleImage[] {
  const base = cfg.splash?.basePath ?? DEFAULT_SPLASH_BASE_PATH;
  return splashDevices.flatMap(({ cssW, cssH, dpr }) => {
    const query = `(device-width: ${cssW}px) and (device-height: ${cssH}px) and (-webkit-device-pixel-ratio: ${dpr})`;
    return [
      {
        url: `${base}/${cssW * dpr}x${cssH * dpr}`,
        media: `${query} and (orientation: portrait)`,
      },
      {
        url: `${base}/${cssH * dpr}x${cssW * dpr}`,
        media: `${query} and (orientation: landscape)`,
      },
    ];
  });
}

/**
 * Metadata fragment to merge into the App Router root layout's `metadata`:
 * applicationName + iOS web-app capability + telephone format-detection off
 * (so phone numbers in copy aren't auto-linked in standalone mode). Spread this
 * into the layout's exported `metadata` alongside the app's title/description.
 */
export function pwaMetadata(cfg: PwaConfig): Metadata {
  return {
    applicationName: cfg.name,
    appleWebApp: {
      capable: true,
      title: cfg.name,
      statusBarStyle: "default",
      startupImage: startupImages(cfg),
    },
    formatDetection: { telephone: false },
  };
}

/**
 * Viewport fragment to merge into the layout's exported `viewport`. Sets the
 * browser/OS theme colour to the app's themeColor, with sane mobile defaults.
 */
export function pwaViewport(cfg: PwaConfig): Viewport {
  return {
    themeColor: cfg.themeColor,
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  };
}
