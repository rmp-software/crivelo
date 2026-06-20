import { createSplashRoute } from "@crivelo/pwa";
import { criveloPwa } from "../../pwa.config";

// iOS launch images (apple-touch-startup-image), served at the root (NOT under a
// locale prefix), referenced by the startup-image link tags in the head:
//   /pwa-splash/1206x2622  → iPhone 17 portrait (cssW*dpr × cssH*dpr)
//   /pwa-splash/2622x1206  → iPhone 17 landscape
// All the size-parsing + bounds-guard logic lives in @crivelo/pwa's
// createSplashRoute factory; this file just wires the config. The [size] segment
// MUST be named `size` (the factory reads `params.size`), and `/pwa-splash/*` is
// exempted in the i18n middleware matcher so it isn't 307'd to /en/...
// nodejs runtime keeps next/og's ImageResponse rendering reliable (Next requires
// this export to be a static literal in the route module — the factory can't
// supply it).
export const runtime = "nodejs";
export const { GET } = createSplashRoute(criveloPwa);
