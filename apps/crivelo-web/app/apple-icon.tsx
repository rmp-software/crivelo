import { renderIcon } from "@crivelo/pwa";
import { criveloPwa } from "./pwa.config";

// iOS home-screen icon (served at /apple-icon). Full-bleed teal tile — iOS masks
// it to a rounded square automatically — with the white Crivelo monogram.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(criveloPwa, { size: 180, maskable: true });
}
