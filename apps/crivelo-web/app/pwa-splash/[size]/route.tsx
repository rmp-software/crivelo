import { renderSplash, splashDevices } from "@crivelo/pwa";
import { criveloPwa } from "../../pwa.config";

// iOS launch images (apple-touch-startup-image), served at the root (NOT under a
// locale prefix), referenced by the startup-image link tags in the head:
//   /pwa-splash/1206x2622  → iPhone 17 portrait (cssW*dpr × cssH*dpr)
//   /pwa-splash/2622x1206  → iPhone 17 landscape
// Each renders the brand mark centred on the teal field at the requested PHYSICAL
// pixel size. nodejs runtime keeps next/og's ImageResponse rendering reliable.
export const runtime = "nodejs";

// Largest physical pixel dimension any device in the matrix can request
// (max of cssW*dpr and cssH*dpr). Derived so it tracks splashDevices instead of
// a hardcoded magic number; bounds render requests to plausible screen sizes.
const MAX_DIMENSION = Math.max(
  ...splashDevices.flatMap((d) => [d.cssW * d.dpr, d.cssH * d.dpr])
);

const SIZE_RE = /^(\d{2,5})x(\d{2,5})$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;

  const match = SIZE_RE.exec(size);
  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return new Response("Not found", { status: 404 });
  }

  return renderSplash(criveloPwa, { width, height });
}
