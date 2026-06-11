import type { Metadata, Viewport } from "next";
import type { PwaConfig } from "./index";

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
