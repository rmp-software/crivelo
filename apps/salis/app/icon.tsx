import { renderIcon } from "@crivelo/pwa";
import { salisPwa } from "./pwa.config";

// Browser favicon (served at /icon). Rounded teal tile with the white Salis drop.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(salisPwa, { size: 32, rounded: true });
}
