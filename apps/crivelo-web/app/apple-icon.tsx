import { renderIcon } from "@crivelo/pwa";
import { coaPwa } from "./pwa.config";

// iOS home-screen icon (served at /apple-icon). Full-bleed teal tile — iOS masks
// it to a rounded square automatically — with the white Coa cone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(coaPwa, { size: 180, maskable: true });
}
