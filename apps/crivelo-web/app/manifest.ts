import type { MetadataRoute } from "next";
import { createManifest } from "@crivelo/pwa";
import { criveloPwa } from "./pwa.config";

// Served at /manifest.webmanifest. See app/pwa.config.tsx for the Crivelo values.
export default function manifest(): MetadataRoute.Manifest {
  return createManifest(criveloPwa);
}
