import { createSplashRoute } from "@crivelo/pwa";
import { salisPwa } from "../../pwa.config";

// iOS launch images (apple-touch-startup-image), referenced by the startup-image
// link tags pwaMetadata() puts in the head — e.g. /pwa-splash/1206x2622 for an
// iPhone 17 portrait. All the size-parsing + bounds-guard logic lives in
// @crivelo/pwa's createSplashRoute factory; this file only wires the config, and
// the [size] segment MUST stay named `size` (the factory reads params.size).
//
// Salis has no i18n middleware, so unlike crivelo-web there is no matcher to
// exempt this route from.
//
// nodejs runtime keeps next/og's ImageResponse rendering reliable (Next requires
// this export to be a static literal in the route module, so the factory cannot
// supply it).
export const runtime = "nodejs";
export const { GET } = createSplashRoute(salisPwa);
