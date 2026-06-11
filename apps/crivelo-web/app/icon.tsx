import { renderIcon } from "@crivelo/pwa";
import { coaPwa } from "./pwa.config";

// Browser favicon (served at /icon). Rounded teal tile with the white Coa cone.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(coaPwa, { size: 32, rounded: true });
}
