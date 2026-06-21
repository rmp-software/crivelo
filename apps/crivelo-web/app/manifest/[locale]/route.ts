import { createManifestRoute } from "@crivelo/pwa";
import { criveloPwa } from "../../pwa.config";

// Per-locale web app manifest, served at the root (NOT under a locale prefix):
//   /manifest/en  → English manifest (start_url /en, lang en)
//   /manifest/pt  → Portuguese manifest (start_url /pt, lang pt-BR)
// All the locale-lookup + status logic (unknown locale → 404, absent i18n →
// non-localized fallback) lives in @crivelo/pwa's createManifestRoute factory;
// this file just wires the config. The [locale] segment MUST be named `locale`
// (the factory reads `params.locale`), and `/manifest/*` is exempted in the i18n
// middleware matcher so it isn't 307'd to /en/... The bare /manifest.webmanifest
// has no own route (a static app/manifest.ts would force metadata.manifest to it,
// overriding our per-locale link); next.config.js redirects it here to /manifest/en.
// nodejs runtime mirrors the other PWA asset routes (Next requires this export to
// be a static literal in the route module — the factory can't supply it).
export const runtime = "nodejs";
export const { GET } = createManifestRoute(criveloPwa);
