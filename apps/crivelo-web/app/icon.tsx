import { renderIcon } from "@crivelo/pwa";
import { criveloPwa } from "./pwa.config";

// Browser favicon (served at /icon). Rounded teal tile with the white Crivelo monogram.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(criveloPwa, { size: 32, rounded: true });
}
