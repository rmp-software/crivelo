---
slug: locale-aware-pwa-manifest
status: planned
created: 2026-06-21
tracker: local
# Linear breakdown was partially created before arcade.dev got Cloudflare-blocked
# (parent RMP-227 + children RMP-228/229/230/231; the crivelo-web wiring child was
# never created). Running locally; the final task reconciles Linear at the end.
linear_project_id: 2ac8ab29-150b-4787-b0dc-c75613daa20d
linear_parent_issue: RMP-227
feature_branch: feature/locale-aware-pwa-manifest
---

# Locale-aware PWA manifest (`@crivelo/pwa`)

## Context

`crivelo-web` is bilingual (next-intl, locales `en`/`pt`, `defaultLocale: en`,
locale prefix always shown). Its PWA install, however, is locale-agnostic. There
is a single static manifest at `/manifest.webmanifest` built by
`createManifest(criveloPwa)` with:

- `name: "Crivelo"`, `lang: "en"`, an English `description`, and
- `start_url: "/"`.

`start_url: "/"` returns a **307 redirect** to the active locale. A redirecting
`start_url` is a known iOS-PWA anti-pattern (it can suppress or flash the
`apple-touch-startup-image` splash on cold launch), and it means a Portuguese
user's installed app is not a true `pt` install — the manifest still declares
English metadata.

Investigation this session confirmed the served `/en` and `/pt` document heads
are **byte-identical** except visible text (same 76 startup-image links, same
`apple-mobile-web-app-title`, same `/manifest.webmanifest` link), so the
"different language on install" behaviour is entirely down to the single
locale-agnostic manifest + the redirecting `start_url`.

### Why this lives in `@crivelo/pwa`

The package's design rule (see monorepo `CLAUDE.md`) is that it absorbs
complexity so consumers stay config + thin wrappers, and it already exposes a
route-factory precedent: `createSplashRoute(cfg)`. Locale-aware manifests should
follow the same shape. A hard constraint: **the package must not depend on an
i18n library** (no `next-intl` import). The app — the only place that knows the
locale set — passes locale data down as plain config; the package reads the
`[locale]` route param as a plain string (core Next, not an i18n lib).

## Goals

- Per-locale manifest with a **200** `start_url` (`/en`, `/pt`), localized
  `description`, and correct `lang`/`dir`.
- Each locale is a **distinct installable app** (distinct manifest `id` =
  per-locale `start_url`), so installing from `/pt` yields a Portuguese app
  launching at `/pt`.
- Keep the logic in `@crivelo/pwa`, i18n-library-free, so a 2nd/3rd app onboards
  with config + a one-line route wrapper.
- **Fully backward compatible**: locale support is opt-in; apps without locales
  change nothing.
- Add a `packages/pwa/README.md` documenting the whole package.

## Non-goals

- npm publishing / out-of-monorepo distribution wiring (README skips
  installation; distribution is a possible future, not this feature).
- Service worker / offline / install-prompt UI (the package is install-only by
  design).
- Changing the device matrix, icon rendering, or splash rendering.
- Localizing `name`/`short_name` (`"Crivelo"` is a proper noun, stays constant).

## Design

### 1. `PwaConfig` gains an optional `i18n` map (plain data, no library)

```ts
export interface PwaConfig {
  // ...existing fields unchanged...
  /**
   * Optional locale-aware manifest data. Omit for single-locale apps (today's
   * behavior is unchanged). The app supplies this as plain data — the package
   * never imports an i18n library.
   */
  i18n?: {
    /**
     * Per-locale overrides, keyed by the route's `[locale]` segment. List every
     * locale you serve (including the default — its strings double as the bare
     * `/manifest.webmanifest` fallback via the top-level `cfg.description`/
     * `cfg.lang`). Any locale absent here falls back to the top-level fields.
     */
    locales: Record<
      string,
      {
        /** Localized manifest `description`. */
        description: string;
        /** BCP-47 manifest `lang` (e.g. "en", "pt-BR"). */
        lang: string;
        /** Manifest `dir`. Default "ltr". */
        dir?: "ltr" | "rtl";
        /** 200 `start_url` for this locale. Default `/${locale}`. */
        startUrl?: string;
      }
    >;
  };
}
```

### 2. `createManifest(cfg, locale?)` — pure builder, back-compatible

- `createManifest(cfg)` (no locale) → **byte-identical to today** (`start_url:
  "/"`, `cfg.description`, `cfg.lang`).
- `createManifest(cfg, locale)` where `cfg.i18n.locales[locale]` exists →
  localized manifest:
  - `start_url` = `locales[locale].startUrl ?? \`/${locale}\``
  - `id` = same `start_url` (distinct installs per locale)
  - `lang` = `locales[locale].lang`, `dir` = `locales[locale].dir ?? "ltr"`
  - `description` = `locales[locale].description`
  - `name`/`short_name`/colours/icons unchanged from `cfg`.
- `createManifest(cfg, locale)` where `cfg.i18n` is absent **or** the locale is
  unknown → falls back to the non-localized manifest (degrade gracefully, never
  emit a broken manifest).

### 3. `createManifestRoute(cfg)` — new factory (mirrors `createSplashRoute`)

```ts
// packages/pwa/manifest.ts (or a sibling) — returns { GET }
export function createManifestRoute(cfg: PwaConfig): {
  GET: (req: Request, ctx: { params: Promise<{ locale: string }> }) => Promise<Response>;
};
```

Behaviour:

- Reads `params.locale` (plain string from the dynamic segment).
- If `cfg.i18n` is configured and `locale` is **unknown** → `404`.
- If `cfg.i18n` is **absent** (app wired the route but set no locales) → serve
  the non-localized `createManifest(cfg)` (misconfig degrades to "works, not
  localized", not a 404).
- Otherwise → `Response.json(createManifest(cfg, locale))` with
  `Content-Type: application/manifest+json`.

The param segment **must** be named `locale` (the factory reads `params.locale`),
matching how `createSplashRoute` reads `params.size`.

### 4. crivelo-web wiring (app-only; not package changes)

- **`app/manifest/[locale]/route.ts`** (new): `export const { GET } =
  createManifestRoute(criveloPwa)`. Served at `/manifest/en`, `/manifest/pt`.
  Grouped at the root with the other PWA asset routes (`pwa-icon/[variant]`,
  `pwa-splash/[size]`) for consistency with the `createSplashRoute` precedent.
- **`middleware.ts`**: add `manifest` to the matcher exclusion alternation
  (`(?:icon|apple-icon|pwa-icon|pwa-splash|manifest)(?:/|$)`) so `/manifest/*`
  is served at the root, not 307'd into i18n.
- **`app/[locale]/layout.tsx`** `generateMetadata`: set
  `manifest: \`/manifest/${locale}\`` (the function already has `locale`; plain
  string interpolation, no new dependency). This replaces the static
  `manifest: "/manifest.webmanifest"`.
- **`app/pwa.config.tsx`**: add the `i18n` block:

  ```ts
  i18n: {
    locales: {
      en: { description: "Tools for people who live coffee.", lang: "en" },
      pt: { description: "Ferramentas para quem vive café.",   lang: "pt-BR" },
    },
  }
  ```

- **`app/manifest.ts`** (existing static route at `/manifest.webmanifest`):
  **kept** as a default-locale fallback for anything hitting the bare URL
  (crawlers, link previews). `createManifest(criveloPwa)` still returns the
  non-localized manifest — unchanged.
- iOS metadata in `pwaMetadata` (`apple-mobile-web-app-title`, startup-image
  links) is **unchanged**: the title `"Crivelo"` is constant and startup images
  are device-based, not locale-based.

### 5. `packages/pwa/README.md` (new deliverable)

A README documenting the whole package. Scope:

- **Skip installation / distribution.**
- **Getting started** — step-by-step wiring of a **basic non-locale** PWA:
  1. Author a `PwaConfig` (name, colours, brand `mark`).
  2. Add `"@crivelo/pwa"` to `next.config` `transpilePackages` (it ships raw
     `.ts/.tsx`).
  3. Thin App Router wrapper files the conventions force to be app-local:
     `app/manifest.ts` → `createManifest(cfg)`; `app/icon.tsx` /
     `app/apple-icon.tsx` / `app/pwa-icon/[variant]/route.tsx` → `renderIcon`;
     `app/pwa-splash/[size]/route.tsx` → `createSplashRoute(cfg)` (with the
     required `runtime` export).
  4. Spread `pwaMetadata(cfg)` / `pwaViewport(cfg)` into the root layout's
     `metadata` / `viewport`, plus `manifest: "/manifest.webmanifest"`.
- **API reference** — detailed docs for every export: `PwaConfig` (every field,
  defaults, and the Satori "literal colours only" constraint), `createManifest`,
  `createManifestRoute`, `renderIcon`, `renderSplash`, `createSplashRoute`,
  `pwaMetadata`, `pwaViewport`, `splashDevices`, `DEFAULT_SPLASH_BASE_PATH`,
  `SplashDevice`.
- **Locale-aware manifest** — a section covering the opt-in `i18n` config,
  `createManifest(cfg, locale)`, `createManifestRoute(cfg)`, and the per-locale
  route + middleware + layout wiring (referencing the crivelo-web example).

## Backward compatibility

- `PwaConfig.i18n` is optional → existing configs type-check unchanged.
- `createManifest`'s new `locale?` arg is optional → every existing call site is
  valid and produces **byte-identical output**.
- `createManifestRoute` is a new export → nothing references it until opt-in.
- The middleware + `app/manifest/[locale]/route.ts` changes are **crivelo-web
  only**; no other app (Molly, etc.) is touched.

## Acceptance criteria

- [ ] Given a request to `/manifest/pt`, when served, then it returns `200`
  with `Content-Type: application/manifest+json` and body fields
  `start_url: "/pt"`, `id: "/pt"`, `lang: "pt-BR"`,
  `description: "Ferramentas para quem vive café."`.
- [ ] Given a request to `/manifest/en`, then `start_url: "/en"`, `id: "/en"`,
  `lang: "en"`, English description — and `id` differs from the `pt` manifest.
- [ ] Given a request to `/manifest/fr` (unknown locale, `i18n` configured),
  then `404`.
- [ ] Given the `/pt` page head, then it contains
  `<link rel="manifest" href="/manifest/pt">`; given `/en`, then
  `<link rel="manifest" href="/manifest/en">`.
- [ ] Given the localized `start_url` (`/en`, `/pt`), when fetched, then it
  resolves `200` (no 307 redirect).
- [ ] Given a `PwaConfig` with no `i18n`, when `createManifest(cfg)` is called,
  then the output is byte-identical to the current implementation.
- [ ] Given a route wired with `createManifestRoute(cfg)` where `cfg.i18n` is
  absent, when any `/manifest/<x>` is requested, then it serves the
  non-localized manifest (no 404).
- [ ] Given `packages/pwa/README.md`, then it contains a non-locale Getting
  started section and an API reference covering every package export.
- [ ] (Manual, real device) Given an iPhone, when installing from `/pt` and
  cold-launching after a reboot (to clear iOS launch snapshots), then the app
  opens in Portuguese at `/pt` and shows the teal splash. Flagged as requiring
  physical-device validation — headless checks do not prove iOS splash behaviour.

## Testing

- **Unit** (extend the existing `packages/pwa/*.test.ts` suite):
  `createManifest(cfg)` byte-identity; `createManifest(cfg, locale)` localized
  fields + distinct `id`; unknown-locale and absent-`i18n` fallback paths.
- **Route**: `createManifestRoute` returns the right status + content-type for
  known locale, unknown locale (404), and absent `i18n` (fallback).
- **Integration**: assert the rendered `/en` and `/pt` heads link the correct
  per-locale manifest; assert localized `start_url`s return `200`.
- **Manual device validation** (per acceptance criteria) — required, flagged.

## Out of scope / future

- npm publishing and out-of-monorepo distribution (peer-dep/install docs).
- RTL locales (the `dir` field is plumbed but unused by current `en`/`pt`).
- Localizing the installed app `name`/`short_name`.

## Tasks

- [ ] Package — `PwaConfig.i18n` + `createManifest(cfg, locale?)` builder
  - AC: no-`i18n` `createManifest(cfg)` is byte-identical to today;
    `createManifest(cfg, locale)` emits localized `start_url`/`id`/`lang`/`dir`/
    `description`; absent-`i18n` or unknown locale falls back to non-localized.
  - Test: `cd packages/pwa && pnpm test` — unit tests pass: (a) `createManifest(cfg)`
    deep-equals pre-change output; (b) `createManifest(cfg,'pt')` →
    `start_url:'/pt'`, `id:'/pt'`, `lang:'pt-BR'`, pt description; (c)
    `createManifest(cfg,'fr')` falls back. `npx tsc --noEmit` exits 0.
- [ ] Package — `createManifestRoute(cfg)` factory
  - AC: factory mirrors `createSplashRoute`; reads `params.locale`; unknown locale
    → 404 when `i18n` configured; absent `i18n` → serves non-localized manifest (no
    404); `Content-Type: application/manifest+json`.
  - Test: `cd packages/pwa && pnpm test` — route tests pass: known locale → 200 +
    content-type + localized body; unknown → 404; cfg without `i18n` → 200
    non-localized. `npx tsc --noEmit` exits 0.
- [ ] crivelo-web — wire per-locale manifest
  - AC: `app/manifest/[locale]/route.ts` → `createManifestRoute(criveloPwa)`;
    `manifest` added to middleware matcher; layout `generateMetadata` sets
    `manifest: /manifest/${locale}`; `pwa.config.tsx` `i18n` block (en+pt); bare
    `/manifest.webmanifest` still works; `/pt` head links `/manifest/pt`, `/en`
    links `/manifest/en`; localized `start_url`s resolve 200.
  - Test: `pnpm --filter crivelo-web build` succeeds; `curl -s
    localhost:3000/manifest/pt` → pt JSON; `curl -sL localhost:3000/pt | grep
    'rel="manifest"'` → `/manifest/pt` (same for en); `curl -sI localhost:3000/en`
    → 200 (no 307).
- [ ] `packages/pwa/README.md` — Getting started + API reference
  - AC: non-locale Getting started (config → `transpilePackages` → thin wrapper
    files → layout metadata); API reference for every export (`createManifest`,
    `createManifestRoute`, `renderIcon`, `renderSplash`, `createSplashRoute`,
    `pwaMetadata`, `pwaViewport`, `PwaConfig`, `splashDevices`,
    `DEFAULT_SPLASH_BASE_PATH`, `SplashDevice`); locale-aware section. No installation.
  - Test: README exists; grep each export name appears; Getting started wires a
    non-locale app end-to-end; no installation section.
- [ ] Verification gate (manual, real device)
  - AC: install crivelo-web from `/pt`, reboot phone (clears iOS launch snapshots),
    cold-launch → Portuguese app at `/pt` with the teal splash; `/en` likewise.
  - Test: deploy preview; on iPhone install `/pt` → Add to Home Screen → reboot →
    cold-launch → confirm pt + splash; repeat `/en`. Headless checks can't prove
    iOS splash — physical device required.
- [ ] Reconcile Linear (run when arcade.dev is reachable)
  - AC: the partial Linear breakdown is completed and synced — create the missing
    `crivelo-web — wire per-locale manifest` child under parent **RMP-227** (Crivelo
    project), and reflect final state (parent + all children → Done) at feature end.
  - Test: parent RMP-227 has 5 children (RMP-228/229/230/231 + the wiring child);
    `Linear_GetIssue RMP-227` shows it closed once the feature→main PR merges.
