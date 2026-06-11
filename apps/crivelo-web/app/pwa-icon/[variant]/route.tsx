import { renderIcon } from "@crivelo/pwa";
import { criveloPwa } from "../../pwa.config";

// Manifest icon tiles (referenced by app/manifest.ts):
//   /pwa-icon/192          → rounded 192 tile
//   /pwa-icon/512          → rounded 512 tile
//   /pwa-icon/512-maskable → full-bleed 512 tile (purpose: maskable)
// nodejs runtime keeps next/og's ImageResponse rendering reliable under Next 14.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params;

  switch (variant) {
    case "192":
      return renderIcon(criveloPwa, { size: 192, rounded: true });
    case "512":
      return renderIcon(criveloPwa, { size: 512, rounded: true });
    case "512-maskable":
      return renderIcon(criveloPwa, { size: 512, maskable: true });
    default:
      return new Response("Not found", { status: 404 });
  }
}
