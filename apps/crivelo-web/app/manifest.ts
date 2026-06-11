import type { MetadataRoute } from "next";
import { createManifest } from "@crivelo/pwa";
import { coaPwa } from "./pwa.config";

// Served at /manifest.webmanifest. See app/pwa.config.tsx for the Coa values.
export default function manifest(): MetadataRoute.Manifest {
  return createManifest(coaPwa);
}
