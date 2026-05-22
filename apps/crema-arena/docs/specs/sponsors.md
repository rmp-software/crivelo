---
slug: sponsors
status: in-progress
created: 2026-05-20
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-106
feature_branch: feature/sponsors
---

# Sponsors

## Overview

Track which sponsors support each TNT and credit them across the live + audience surfaces. Sponsors are a global pool — created once, attached to as many events as needed, like competitors. No contribution categorization is tracked in the app: who gave milk, coffee, or money to the prize pool is information the organizer handles outside the platform. From the app's perspective, a sponsor is just a name + logo associated with an event.

The hard problem isn't the data — it's display. The live TV and audience companion screens are already tight on space and tone (espresso-on-cream, low chrome, "ao vivo" focused). Sponsor placement that feels like an ad bar would degrade the brand. The goal is *quiet credit*: visible, tasteful, equal billing across sponsors, never competing with the duel itself.

## Problem / motivation

Today there's no place in the app to record who funds or supplies the TNT. Organizers track it in spreadsheets and group chats. Sponsors deserve some visibility — they're paying for the event — and several organizers have asked for a way to show the brands without turning the screen into NASCAR.

## Scope

**In scope:**
- Sponsor CRUD (global pool, like competitors): name, logo, website
- Attach/detach sponsors to/from an event
- Reorder sponsors within an event (display order matters)
- Logo upload via Vercel Blob (reuse `lib/file-upload.ts`)
- Surface sponsors on:
  - Organizer event detail page (`/dashboard/events/[id]`)
  - Live TV display (`/live/[eventId]`)
  - Audience companion (`/e/[eventId]`)
  - Podium / finished state (TV + companion)

**Out of scope (explicit cuts):**
- Contribution categorization (milk / coffee / prize-pool) — user decision: not modeled in the app
- Sponsor tiers (gold / silver / bronze) — flat hierarchy, equal billing
- Per-event logo overrides — one logo per sponsor, used everywhere
- Sponsor portal / self-service — sponsors don't have accounts
- Email, contracts, contact tracking
- Sponsor analytics (impressions, click-throughs)
- Animated logos, video sponsor reels

## Surfaces affected

Routes:
- `app/dashboard/sponsors/page.tsx` — **new** (sponsors list + search)
- `app/dashboard/sponsors/components/SponsorForm.tsx` — **new** (create/edit form)
- `app/dashboard/events/[eventId]/page.tsx` — **modified** (add sponsors section)
- `app/live/[eventId]/page.tsx` — **modified** (sponsor treatment on TV)
- `app/e/[eventId]/page.tsx` — **modified** (sponsor block on audience companion)

API:
- `app/api/sponsors/route.ts` — **new** (GET list, POST create)
- `app/api/sponsors/[id]/route.ts` — **new** (GET, PATCH, DELETE)
- `app/api/events/[id]/sponsors/route.ts` — **new** (GET, POST attach, PATCH reorder)
- `app/api/events/[id]/sponsors/[sponsorId]/route.ts` — **new** (DELETE detach)

Library / schema:
- `prisma/schema.prisma` — **modified** (add `Sponsor` + `EventSponsor` models)
- `prisma/migrations/<timestamp>_add_sponsors/` — **new**
- `lib/file-upload.ts` — **reused** (logo upload path)
- `lib/data-cadence.ts` — **new** (small helper documenting hot/cold/**frozen** polling tiers; see *Data cadence tiers* below)

Nav:
- Sidebar (`app/components/Sidebar.tsx`) — **modified** (add "Patrocinadores" link under organizer-visible section)

## Data model

```prisma
model Sponsor {
  id         String   @id @default(uuid())
  name       String
  logo_url   String?  // Vercel Blob URL; nullable for sponsors added without a logo yet
  website    String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  events     EventSponsor[]
}

model EventSponsor {
  id         String   @id @default(uuid())
  event_id   String
  sponsor_id String
  position   Int      @default(0)
  created_at DateTime @default(now())
  event      Event    @relation(fields: [event_id], references: [id], onDelete: Cascade)
  sponsor    Sponsor  @relation(fields: [sponsor_id], references: [id], onDelete: Cascade)

  @@unique([event_id, sponsor_id])
  @@index([event_id, position])
}
```

`Event` model gets a back-relation: `sponsors EventSponsor[]`.

## API surface

```
GET    /api/sponsors                              -> [{ id, name, logo_url, website, events_count }]
POST   /api/sponsors                              -> { id, name, logo_url, website } (multipart for logo)
GET    /api/sponsors/:id                          -> { id, name, logo_url, website, events: [...] }
PATCH  /api/sponsors/:id                          -> { id, ... } (multipart accepted for logo replacement)
DELETE /api/sponsors/:id                          -> 204 (cascades EventSponsor links; 409 if cascade would affect a running event — soft-block)

GET    /api/events/:id/sponsors                   -> [{ id, sponsor: {...}, position }]
POST   /api/events/:id/sponsors                   -> { id, sponsor, position } body: { sponsor_id }
PATCH  /api/events/:id/sponsors                   -> reorder; body: { order: [eventSponsorId, ...] }
DELETE /api/events/:id/sponsors/:sponsorId        -> 204

# Frozen-tier polling: live + companion pages poll this every ~15s (NOT 5s like current-duel)
GET /api/events/:id/sponsors                      -> [{ id, sponsor: {...}, position }]
   Response headers: Cache-Control: public, max-age=15, s-maxage=15
```

Errors:
- 422 on validation (empty name, invalid website URL, oversized logo)
- 409 on deleting a sponsor attached to a running event (suggest detach first)
- 404 if sponsor or event not found
- 401 if not authenticated, 403 if cross-organizer access

## Data cadence tiers

Today the app has two implicit polling tiers:
- **Hot** — polled every 5s. Endpoints: `current-duel`, `bracket`, `leaderboard`. Reflects live duel state.
- **Cold** — fetched once at page load. Endpoints: event metadata, competitor pool, organizer profile.

This feature introduces a third tier, **frozen**, for data that changes during an event but only rarely. Sponsors are the inaugural case. Future near-static data (judge roster, event description tweaks, sponsor links) should follow the same pattern instead of being shoved into the hot polling payload.

- **Frozen** — polled every 15s. `Cache-Control: public, max-age=15, s-maxage=15` so Vercel edge absorbs the bulk of requests. Server uses `next: { revalidate: 15 }`; client uses a 15s `setInterval`.

A small helper at `lib/data-cadence.ts` exports the constants and documents the pattern so future endpoints don't re-invent the cadence:

```ts
// lib/data-cadence.ts
export const CADENCE_HOT_MS = 5_000;     // current-duel, bracket, leaderboard
export const CADENCE_FROZEN_MS = 15_000; // sponsors and future near-static data
// Cold-tier data is fetched once at page load and not polled.
```

Bikeshed-friendly: if `frozen` reads wrong in code, `stale`, `slow`, or `near-static` are acceptable substitutes. Lock the name during the helper sub-issue.

## UI / Copy

All pt-BR, sentence case, `você` everywhere, no period in button labels.

### Sidebar nav

Add **Patrocinadores** entry under the existing organizer-visible section, grouped near "Competidores" (also a global pool).

### Sponsor list page (`/dashboard/sponsors`)

- Page heading: **Patrocinadores**
- Search input: placeholder `Buscar por nome`
- Empty state: `Nenhum patrocinador ainda. Cadastra o primeiro →`
- Add button: `Adicionar patrocinador`
- List row: logo thumb (40×40, rounded), name, "em N eventos" stat, edit / delete icons

### Sponsor form (modal or page)

- Title: `Novo patrocinador` / `Editar patrocinador`
- Fields:
  - `Nome` (required)
  - `Logo` (image upload, optional, max 4 MB — same constraints as competitor photo)
  - `Site` (optional, URL validated)
- Submit: `Salvar`
- Cancel: `Cancelar`
- After save: toast `Patrocinador salvo.`

### Event detail — sponsors section

Below the existing competitors block:
- Section heading: **Patrocinadores deste evento**
- Empty state: `Nenhum patrocinador adicionado.`
- Sponsor row: logo thumb, name, "Remover" button (only in setup status)
- Add button: `Adicionar patrocinador` → opens picker modal (search global pool, multi-select OK)
- Reorder: drag handle on the left of each row (only in setup status)
- Confirmation modal on remove: `Remover [Nome] deste evento?`

### Live TV display (`/live/[eventId]`)

**Treatment: Option A — static bottom strip.** Locked.

Layout constraints — the live feed renders on screens from **1920×1080 up to 4K (3840×2160)** at a fixed **16:9** aspect ratio. Use viewport-relative sizing throughout (`vh` / `vw` / proportional flex), not pixel hardcodes. The whole page should look proportionally identical at any 16:9 viewport above the 1920×1080 minimum.

**Locked treatment (validated via prototype `against real logos`):** the live display is **dark espresso** (`--espresso-900`), so the earlier "cream strip / muted-ink logo" idea is wrong — it would be a glaring bright bar, and real logos (dark-on-transparent, solid-bg, white-ink) either vanish or clash. Instead:

- **Dark hairline band:** full-width bottom strip, `~5vh` (≈54px@1080p / ≈108px@2160p). Background = subtle `linear-gradient(to top, rgba(0,0,0,.35), transparent)` + 1px top border `rgba(220,197,158,.14)`. NOT a cream fill.
- **`APOIO` label** far left, `--font-mono`, letter-spaced caps, muted cream (`--crema-300`).
- **Cream chips for logos (the key decision):** every logo sits inside a cream rounded card — fill `--surface-raised` (#FFFCF3) or `--crema-50`, `--radius-sm` (≈ proportional), `object-fit: contain`, uniform height (~`40px`@1080p inside a ~`60px` chip). This normalizes ANY logo regardless of its own color / transparency / aspect, and visually rhymes with the cream QR card already on the stage. Logos are NOT recolored/grayscaled — shown as-is inside the chip.
- **No-logo sponsor:** render the sponsor name (`--font-display`) as text inside the same cream chip.
- **Right clearance:** the strip right-pads to clear the fixed bottom-right QR card (~`460px`@1080p, proportional) so chips never slide under the QR.
- Layout adapts to count: 1 → left-aligned after label; 2–4 → even gaps; 5+ → rotating windows of ~4 chips, ~5s per window, crossfade.
- Max chip width per slot `~12vw`. No hover (unattended).

Verify in browser at both `1920×1080` and `3840×2160` via Playwright `setViewportSize`.

**Future placement — Option B (between-rounds full slide).** Out of scope here. The current round-transition flow looks too much like an active duel and the post-duel result screen doesn't linger long enough — both need rework before a between-rounds sponsor slide would feel right. If/when round-transition UX gets revisited, that change unlocks Option B and sponsor logos would appear in **original color** there for full visibility.

### Audience companion (`/e/[eventId]`)

- Single sponsor block at the **bottom** of every tab (Ao vivo / Chave / Leaderboard)
- Heading: `Apoio` (small, mono caps, `--fg-3`)
- **Same cream-chip language as the TV** — each logo in a cream chip (`--surface-raised` fill, `--radius-sm`, `object-fit: contain`, max ~56px tall), centered row, wrap on overflow. Because the companion is a light/cream surface, give each chip a 1px `--border` hairline so it separates from the page. No-logo sponsor → name text in the chip.
- If a sponsor has a `website` set: wrap the chip in `<a href={website} target="_blank" rel="noopener noreferrer">` (opens in new tab). Most won't have one; then the chip is non-interactive. No standalone URL text either way.

### Podium / finished state

- TV podium screen (dark espresso): under the trophy, a single line `Premiação patrocinada por` (`--font-display`) followed by sponsor logos in **cream chips** (same language as the strip, smaller — ~`32px` logo). Centered.
- Audience finished view (light): same `Premiação patrocinada por` line + cream chips with the hairline border.
- If no sponsors attached, hide the credit line entirely.

## Acceptance criteria

- [ ] Given an authenticated organizer, when they POST `/api/sponsors` with name and a valid logo, then a sponsor row is created and 201 is returned with `logo_url` resolving on Vercel Blob
- [ ] Given a sponsor exists, when an organizer visits `/dashboard/sponsors`, then the sponsor appears in the list with its logo thumbnail and an "em N eventos" count
- [ ] Given a sponsor and an event in setup status, when the organizer attaches the sponsor via the event detail page, then it appears under "Patrocinadores deste evento" and a row is created in `event_sponsors`
- [ ] Given multiple sponsors attached to an event, when the organizer drags a sponsor to a new position, then PATCH `/api/events/:id/sponsors` persists the order and the new order is reflected on the next page load
- [ ] Given a sponsor is attached to a running event, when the audience navigates to `/live/[eventId]` in a browser, then the sponsor's logo is visible in the chosen treatment (default: bottom strip) and the duel area is not visually obscured
- [ ] Given a sponsor is attached to a running event, when the audience navigates to `/e/[eventId]` on mobile, then the sponsor's logo appears in the "Apoio" block at the bottom of each tab without breaking layout
- [ ] Given an event finishes, when the podium renders on TV and companion, then sponsors are credited under `Premiação patrocinada por` (TV) and in the finished tab (companion)
- [ ] Given a sponsor with no logo, when displayed anywhere, then the sponsor's name renders in `--font-display` as a fallback
- [ ] Given an organizer tries to delete a sponsor attached to a running event, when they confirm, then the request returns 409 and the UI surfaces "Esse patrocinador está em um evento ao vivo. Remove dos eventos primeiro." — sponsor remains
- [ ] Given a sponsor logo > 4 MB is uploaded, when the form submits, then a validation error appears and the form is not submitted
- [ ] Given the live display renders at `3840×2160` (4K) viewport, when the sponsor strip is visible, then proportions match the `1920×1080` layout (strip ≈ 5vh, logos ≈ 12vw) with no overflow, blank space, or visual jank — verified via Playwright `setViewportSize` snapshots at both resolutions
- [ ] Given a sponsor is added to a running event, when 20s elapse, then the live and companion surfaces show the new sponsor without a page reload (driven by the 15s frozen-tier poll on `GET /api/events/:id/sponsors`)
- [ ] Given a sponsor on the audience companion has a `website` set, when the user taps the logo, then the website opens in a new tab; given no website is set, the logo is non-interactive

## Risks / open questions

Most defaults from the original draft are now locked in (see *UI / Copy* and *Data cadence tiers* for the resolved decisions). Remaining open items:

- **Option B (between-rounds slide) blocked on a round-transition UX rework.** The current inter-round phase looks too much like an active duel, and the post-duel result screen doesn't linger long enough — both need redesign before a between-rounds sponsor slide can land cleanly. Tracked separately; **not in this feature**. When that work happens, B becomes viable and sponsor logos would render in original color for that placement.
- **Logo aspect ratio in practice.** Spec sets max heights and slot widths but no per-logo `container treatment` (e.g. white card behind each). Relying on the monochrome silhouette + cream background on TV, and clean rows of original-color logos on companion. If real-world logos break the look, revisit during the live-display sub-issue using `/crema-arena-design`.
- **Frozen tier naming.** Spec uses `frozen` as the counterpart to hot/cold. If `stale` / `slow` / `near-static` read better in code, swap during the `lib/data-cadence.ts` sub-issue.
- **LGPD note for external sponsor links.** Opening sponsor sites in a new tab triggers third-party cookies. Likely fine since the user initiates, but flag for the production LGPD pass.

## Breakdown sketch

Suggested sub-issues (rough ordering, each ~2–8h):

1. Schema migration + Prisma types (`Sponsor`, `EventSponsor`, `Event.sponsors` relation)
2. Sponsor CRUD API routes (`/api/sponsors`, `/api/sponsors/:id`) with logo upload via Vercel Blob
3. Event-sponsor association API (`/api/events/:id/sponsors`: attach, detach, reorder)
4. `lib/data-cadence.ts` helper documenting hot/cold/**frozen** tiers + `GET /api/events/:id/sponsors` polled at 15s with `Cache-Control: public, max-age=15` (introduces the frozen tier)
5. Sponsor list page (`/dashboard/sponsors`) — list, search, create/edit modal with logo upload, delete with running-event 409 handling
6. Sponsors section on event detail page — list, add modal (multi-select like competitors), drag-and-drop reorder, remove with confirmation
7. Sponsor strip on live TV display (Option A, viewport-relative sizing) — prototype against `crema-arena-design`, verify at 1920×1080 AND 3840×2160
8. Sponsor block on audience companion (bottom of each tab) with optional external links
9. Podium credit on finished state (TV + companion)
10. Cross-surface browser verification (Playwright at multiple viewports), nav links, copy review
