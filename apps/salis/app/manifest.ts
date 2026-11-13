import type { MetadataRoute } from "next";
import { createManifest } from "@crivelo/pwa";
import { salisPwa } from "./pwa.config";

// Served at /manifest.webmanifest. See app/pwa.config.tsx for the Salis values.
export default function manifest(): MetadataRoute.Manifest {
  return createManifest(salisPwa);
}
