import { renderIcon } from "@crivelo/pwa";
import { salisPwa } from "./pwa.config";

// iOS home-screen icon (served at /apple-icon). Full-bleed teal tile — iOS masks
// it to a rounded square itself — with the white Salis drop.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(salisPwa, { size: 180, maskable: true });
}
