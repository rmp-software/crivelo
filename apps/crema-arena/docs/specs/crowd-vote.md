---
slug: crowd-vote
status: planned
created: 2026-05-22
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-119
feature_branch: feature/crowd-vote
---

# Crowd vote (Voto do público)

## Overview

Let the *audience* vote on the live duel from their phones on `/e/[eventId]`, in parallel with — and never touching — the official 3-judge result. While a duel is live, anyone watching can tap a side; the crowd tally updates on the audience companion and shows as a subtle lean bar on the TV. When the event finishes, one competitor is crowned **Favorito do público**, an award entirely separate from the champion.

Crowd vote is **configurable per event** (on by default). The toggle gates only the *voting layer* — the ballot, the TV crowd-lean bar, and the award. Pour photos and their (correctly labelled) names are independent: an organizer running a quiet or photo-only event switches crowd vote off and still shows the pour photo with the right names under each cup.

This is the inaugural *audience-as-participant* feature. The judges decide who wins; the crowd gets a voice that's visible, fun, and consequence-free. There's no login — the audience is anonymous. Votes are deduped best-effort per device. The hard constraint is **integrity isolation**: nothing in this feature may read from or write to the judge vote path (`votes_a` / `votes_b` / `Vote` / duel completion). The official result and bracket advancement must behave identically whether crowd voting exists or not.

A subtlety makes the vote real rather than confusing: the pour photo usually shows **both cups side by side**, and nothing today records which physical cup belongs to which competitor — every surface just assumes `A = left`. The crowd's only information is that photo, so their tap must bind to the cup they actually *see*, not an assumed slot order. The fix is a one-tap capture step that records the cup→competitor mapping, after which the photo itself becomes the ballot. See *Photo correspondence (the ballot)*.

## Problem / motivation

Today the audience companion is read-only — the crowd watches but can't act. That's a missed engagement moment: a packed café watching a tense pour has nothing to *do*. Crowd vote turns spectators into participants, creates a shareable stat ("the crowd favorite"), and feeds future competitor-profile work ([[RMP-120]]) with a popularity signal. It rides the existing polling architecture, so it needs no realtime infrastructure.

**Judging is blind; the crowd is not.** Judges physically point at the cup whose art they prefer and must never know whose cup is whose; the *organizer* — the only one who knows the identities — relays those picks into TapToTally. The audience, by contrast, *should* know the identities and see attributed votes. The organizer manages leakage operationally (they simply don't broadcast a photo when judges can see the screen), so the app needs **no blind-mode toggle** — when a photo is live, it's safe for names to appear. What the app must guarantee is that left/right on the photo maps to the correct competitor everywhere it's shown.

## Photo correspondence (the ballot)

The whole problem reduces to one missing fact: **which physical cup in the pour photo is which competitor.** That knowledge lives only in the organizer's head. Capture it once and three things fall into place — correct names on the audience photo, inversion-proof crowd voting, and (bonus) fewer organizer mis-taps when relaying judges.

**Capture (one tap, at photo time).** After the organizer takes the photo in TapToTally, the preview shows full-width with the prompt **`Toque no copo de [Nome A]`** and the left cup pre-selected (matching today's `A = left` default). One tap confirms or corrects which side is competitor A; the other cup is B. The orientation is sent with the photo so it's set before the photo ever goes live. The organizer can re-tap to correct it without re-uploading.

When `crowd_vote_enabled` is **off**, the required confirm is skipped to avoid friction — the photo uploads with the default `a`, and a quiet `Trocar lados` affordance lets the organizer fix the *labels* if they happen to be reversed (nothing votes on it, so it's label accuracy only). When **on**, the confirm matters because votes bind to it, so it's surfaced as a required step.

**Storage.** A single field on the duel, `photo_left_slot` (`a` | `b`, default `a`) — *which entry slot is the left cup in the photo*. `a` = entry_a on the left (current hard-coded assumption, so legacy duels and any un-set photo behave exactly as today). `b` = cups swapped.

**Voting (the photo is the ballot).** On the companion, when a two-cup pour photo is live, the photo splits into a **left tap-zone and right tap-zone** with a hairline divider; each zone carries the correct name overlay (resolved via `photo_left_slot`) and highlights when selected. Tapping a cup casts a crowd vote for *that cup's* competitor. The client maps tapped-position → side using `photo_left_slot`; the cast endpoint still records a plain `a`/`b`, so the server stays simple. Inversion is structurally impossible because the tap target *is* the cup. When there is **no** pour photo, voting falls back to the named profile cards (already unambiguous — each card has a face and a name).

**Display.** The same `photo_left_slot` drives the name overlays on the photo on both the companion and the TV, fixing the pre-existing latent bug where overlays assume `A = left`.

**Bonus (same field).** TapToTally's judge-vote A/B buttons are positioned to match `photo_left_slot`, so when a judge points at "the left cup," the organizer taps the left-positioned button — fewer relay errors. Small, optional, uses the data we're already capturing.

## Scope

**In scope:**
- **Per-event toggle** `crowd_vote_enabled` (default on), set in the event form, editable in setup **and** during a running event; gates the ballot, TV lean bar, cast endpoint, and award — not photos/labels
- Anonymous, per-device crowd voting on the **active** duel (`status = in_progress`), one mutable vote per device per duel
- **Photo correspondence:** capture cup→competitor orientation (`photo_left_slot`) with a one-tap step at photo time; use it to label names on the photo correctly (TV + companion) and to drive voting
- **Photo-as-ballot voting** on the companion (tap the cup in a two-cup photo); fall back to named profile cards when no photo
- Crowd tally folded into the existing `current-duel` hot poll (no new polling tier)
- Audience companion ("Ao vivo" tab): optimistic selected state, live tally, "voting closed" state
- TV (`/live/[eventId]`): a **subtle unofficial crowd-lean bar** near the official `N × M` (locked treatment — see *UI / Copy*)
- **Favorito do público** award computed at event finish: most crowd "wins" (duels where the crowd's majority pick), tiebroken by total crowd votes received
- Award surfaced on the companion Leaderboard tab (finished) and as a tasteful credit line on the TV podium
- TapToTally judge-button alignment to `photo_left_slot` (small bonus, same data)

**Out of scope (explicit cuts):**
- Any change to judge vote *recording*, the `Vote` model, vote gating, or duel completion — **hard cut, integrity isolation**. (Re-*positioning* the existing A/B buttons by orientation is cosmetic and allowed; the recorded result is unchanged.)
- Blind-mode / reveal toggle on the TV — handled operationally by the organizer (they don't broadcast a photo when judges can see the screen)
- Crowd vote on past/next/completed duels — voting is only open while a duel is `in_progress`
- Showing the final crowd split on completed duels in the "Chave" tab — natural follow-up, not this slice
- Authenticated / identified voters, accounts, one-human-one-vote guarantees (it's best-effort per device)
- Realtime/WebSocket push — crowd tally updates at the existing hot-poll cadence (own vote is optimistic)
- Live reactions / emotes — separate backlog item ([[RMP-122]])
- Bot-proof anti-fraud — soft mitigations only (see *Risks*); the award is explicitly unofficial

## Surfaces affected

Schema / migration:
- `prisma/schema.prisma` — **modified** (new `CrowdVote` model; `Duel.crowd_votes_a` / `crowd_votes_b` columns + `Duel.crowd_votes` relation; `Duel.photo_left_slot DuelSlot @default(a)`; `Event.crowd_vote_enabled Boolean @default(true)`)
- `prisma/migrations/<timestamp>_add_crowd_vote/` — **new**

API:
- `app/api/duels/[id]/crowd-vote/route.ts` — **new** (POST cast/change vote; **public, no auth**; rejects when the event has crowd vote disabled)
- `app/api/events/route.ts` + `app/api/events/[id]/route.ts` — **modified** (accept/return `crowd_vote_enabled` on create + edit; edit allowed in setup and running)
- `app/api/duels/[id]/photo/route.ts` — **modified** (accept `leftSlot` on POST; add `PATCH` to correct `photo_left_slot` without re-upload)
- `app/api/events/[id]/current-duel/route.ts` — **modified** (add `crowdVotesA` / `crowdVotesB` and `photoLeftSlot` to `currentDuel`)
- `app/api/events/[id]/leaderboard/route.ts` — **modified** (add `crowdFavorite` block + per-competitor crowd stats)

Lib:
- `lib/crowd-vote.ts` — **new** (server-side `computeCrowdFavorite(duels)` aggregation, shared so finished-state math is defined once)
- `lib/device-id.ts` — **new** (client helper: `getOrCreateDeviceId()` + per-duel local selected-side persistence via `localStorage`)

UI:
- `app/dashboard/events/[id]/edit/page.tsx` + the event create form / `EventForm` — **modified** (add the `Voto do público` on/off toggle near `judges_count`)
- `app/components/RunningEventPanel.tsx` — **modified** (live on/off toggle for `crowd_vote_enabled` during a running event)
- `app/components/TapToTally.tsx` — **modified** (post-capture orientation step `Toque no copo de [Nome A]` when crowd vote is on; send `leftSlot` with the photo; position judge A/B buttons by `photo_left_slot`)
- `app/components/tabs/AoVivoTab.tsx` — **modified** (render the crowd-vote ballot for the active duel; name overlays via `photoLeftSlot`)
- `app/components/CrowdVoteBar.tsx` — **new** (photo-as-ballot tap-zones with name overlays, or named-card fallback; tally + selected/closed states; client component)
- `app/components/LiveCompanion.tsx` — **modified** (thread `crowdVotesA/B` + `photoLeftSlot` through the `Duel` type to the tab; no new poll)
- `app/components/tabs/LeaderboardTab.tsx` — **modified** (Favorito do público block on finished state)
- `app/components/LiveDisplay.tsx` (+ `app/live/[eventId]/page.tsx` as needed) — **modified** (photo name overlays via `photoLeftSlot`; subtle crowd-lean bar near the score; podium credit line on finished)

## Data model

Crowd votes get their own table, mirroring how judge votes are denormalized: per-vote rows for auditability + dedup, plus integer counters on `Duel` for a cheap hot read. Counters are kept in sync transactionally in the cast endpoint (a side-switch decrements the old side and increments the new). Reuse the existing `VoteSide` enum (`a` | `b`).

```prisma
model CrowdVote {
  id         String   @id @default(uuid())
  duel_id    String
  device_id  String   // opaque random id from the client (localStorage); not PII
  side       VoteSide
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  duel       Duel     @relation(fields: [duel_id], references: [id], onDelete: Cascade)

  @@unique([duel_id, device_id])  // one mutable vote per device per duel
  @@index([duel_id])
  @@map("crowd_votes")
}
```

`Duel` gains:
```prisma
crowd_votes_a   Int          @default(0)
crowd_votes_b   Int          @default(0)
photo_left_slot DuelSlot     @default(a)  // which entry slot is the LEFT cup in the pour photo
crowd_votes     CrowdVote[]
```

`photo_left_slot` reuses the existing `DuelSlot` enum (`a` | `b`). Default `a` reproduces today's hard-coded `A = left` assumption, so every existing duel and any photo whose orientation wasn't set behaves exactly as before — no migration backfill needed, no regression.

Rationale for denormalized counters: `current-duel` is the hot path polled by every TV and every phone; reading two integers off the duel row beats a `GROUP BY` per poll and matches the existing `votes_a`/`votes_b` pattern. Alternative (live aggregate, no counters) noted in *Risks*.

`Event` gains:
```prisma
crowd_vote_enabled Boolean @default(true)
```
Default `true` means events created before the organizer thinks about it get the headline behavior; the migration backfills existing rows to `true` (finished events are inert — voting is closed; running events simply gain the bar). The toggle is a pure gate: flipping it never deletes votes.

## API surface

```
POST /api/duels/:id/crowd-vote                 (PUBLIC — no session)
  Body: { side: "a" | "b", deviceId: string }
  200  -> { crowdVotesA: number, crowdVotesB: number, yourSide: "a" | "b" }
  400  -> invalid/missing side or deviceId
  403  -> { error: "Voto do público desativado." }   // event.crowd_vote_enabled = false
  404  -> duel not found
  409  -> { error: "Votação encerrada." }   // duel not in_progress
```

Behavior (single transaction):
1. Load duel (+ event); 404 if missing; **403 if `event.crowd_vote_enabled` is false**; 409 if `status !== 'in_progress'`.
2. Upsert `CrowdVote` on `(duel_id, device_id)`:
   - **insert** → increment that side's counter
   - **update, side changed** → decrement old side, increment new side, set `side`
   - **update, side unchanged** → no-op
3. Return the fresh counters + the device's current `yourSide`.

Photo orientation — set at capture, correctable after:
```
POST  /api/duels/:id/photo                     (existing, modified; organizer-only)
  multipart: photo=<file>, leftSlot="a" | "b"  // leftSlot optional; defaults to "a"
  -> { success, photoUrl, photoLeftSlot }

PATCH /api/duels/:id/photo                      (new; organizer-only)
  Body: { leftSlot: "a" | "b" }                 // correct orientation without re-uploading
  -> { success, photoLeftSlot }
```

Read path — **no new endpoint or poll**. Extend `current-duel` with `event.crowdVoteEnabled` (so surfaces know whether to render the ballot/bar) and the `currentDuel` payload with `crowdVotesA` / `crowdVotesB` and `photoLeftSlot`. The client maps a tapped cup-position to a side via `photoLeftSlot`, and already knows its own pick (persisted locally by `lib/device-id.ts`), so no per-device GET is needed.

Finished-state award — extend `leaderboard` with:
```
crowdFavorite: { competitor: { id, name, photoUrl, coffeeShop }, crowdWins: number, crowdVotes: number } | null
```
`null` when crowd vote is disabled for the event **or** no crowd votes were cast all event. Computed by `computeCrowdFavorite(duels)` in `lib/crowd-vote.ts`:
- **crowd "win"** per duel = the entry on the strict-majority crowd side of a *completed* duel with both slots filled. Equal `crowd_votes_a == crowd_votes_b` → no win credited.
- **crowdVotes** per competitor = sum of `crowd_votes_a` (their A-side duels) + `crowd_votes_b` (their B-side duels) across the event.
- Winner = max `crowdWins`, tiebreak max `crowdVotes`, then stable by entry order.

## UI / Copy

All pt-BR, sentence case, `você`, max one `!` per screen, no period on button labels, `×` with spaces, pluralize `1 voto`/`N votos` and `1 duelo`/`N duelos`.

### Event form — crowd vote toggle

In the create/edit event form, near `judges_count`:
- Toggle label: `Voto do público`
- Helper: `O público vota pelo celular, sem afetar o resultado dos jurados.`
- Default on.

During a running event, the same toggle appears in `RunningEventPanel` (organizer controls) so it can be flipped live. Flipping off mid-event hides the ballot + lean bar on the next poll; existing votes are kept. Toast on change: `Voto do público ativado.` / `Voto do público desativado.`

### Organizer — photo capture orientation (TapToTally)

After "Fotografar copos" returns an image, before it's broadcast, show the captured photo full-width with the prompt and two tappable cup-zones:

```
┌──────────────────────────────────────────┐
│  Toque no copo de [Nome A]                 │   ← prompt, --fg
│  ┌─────────────────┬─────────────────┐    │
│  │  ◉ [Nome A]     │   [Nome B]      │    │   ← photo split; left pre-selected
│  │   (cup left)    │   (cup right)   │    │
│  └─────────────────┴─────────────────┘    │
│            [ Confirmar e enviar ]          │
└──────────────────────────────────────────┘
```

- Left cup pre-selected (default `a`). One tap moves the A-label to the other cup; B is implied.
- `Confirmar e enviar` uploads the photo with `leftSlot`. After it's live, a small `Trocar lados` affordance issues the `PATCH` to correct without re-uploading.
- Judges are blind, so this surface (the organizer's device) is the only place identities are bound to cups before broadcast.

### Audience companion — "Ao vivo" tab (`CrowdVoteBar`)

Rendered only when `event.crowdVoteEnabled` is true, `currentDuel` exists, and the duel has two entries. (When crowd vote is disabled, this whole block is absent — the photo + score still render as today.) Sits below the existing judge-score block. Two layouts:

**(a) Photo present — the photo is the ballot:**

```
┌──────────────────────────────────────────┐
│  Voto do público · não oficial            │   ← mono caps label, --fg-3
│  ┌─────────────────┬─────────────────┐    │
│  │   [pour photo   │   pour photo]   │    │   ← single photo, split tap-zones
│  │     left cup    │    right cup    │    │
│  │   ▸ [Nome A]    │    [Nome B]     │    │   ← name overlay per cup (via photoLeftSlot)
│  └─────────────────┴─────────────────┘    │
│  ███████████████░░░░░░░░░░  47 × 31       │   ← lean bar + mono tally
│  Você votou no copo de [Nome A]            │   ← after voting
└──────────────────────────────────────────┘
```

- The pour photo renders once; a hairline divider splits it into a left and right tap-zone. Each zone overlays the correct name, resolved from `photoLeftSlot` (left cup name = the entry named by `photoLeftSlot`).
- Tapping a cup casts for *that cup's* competitor: client computes `side = (tappedSide === 'left' ? photoLeftSlot : other(photoLeftSlot))`. Inversion is impossible — the tap target is the cup.
- Selected cup highlights (e.g. ring + dim the other). Post-vote caption: `Você votou no copo de [Nome]`.

**(b) No photo yet — named profile cards (fallback, already unambiguous):**

```
│  ┌──────────────┐      ┌──────────────┐   │
│  │  [Nome A]    │      │  [Nome B]    │   │   ← face + name, in entry order
│  └──────────────┘      └──────────────┘   │
```

Common to both:
- Label: `Voto do público` with a quiet `· não oficial` suffix. Helper line once: `Quem decide o duelo são os jurados.`
- Optimistic: selected side highlights immediately and the local count bumps; reconcile with the POST response (server counts are authoritative).
- Post-vote: tapping the other cup/card moves the vote (last tap counts).
- Tally: horizontal lean bar (A vs B share) + `crowdVotesA × crowdVotesB` in `--font-mono`. Zero state: bar empty, `Seja o primeiro a votar`.
- When the duel completes mid-view: disable voting, show `Votação encerrada.`, freeze the final bar.

### TV live display (`/live/[eventId]`) — subtle crowd-lean bar (locked)

Shown only when `event.crowdVoteEnabled` is true (else the stage is exactly as today). The TV stays duel-focused; the crowd signal is clearly secondary to the official `N × M`.
- A slim horizontal lean bar directly under/beside the official score, max ~`30vw`, height ~`0.8vh`.
- Tiny mono caps label `PÚBLICO` at the left of the bar; no large raw numbers competing with the judges' score (optional small percentage at the ends, muted `--crema-300`).
- Espresso-surface styling consistent with the stage; viewport-relative sizing (works 1920×1080 → 4K, like the sponsor strip).
- Hidden entirely when the duel has zero crowd votes (no empty chrome).

### Finished state — Favorito do público

- **Companion Leaderboard tab:** a card above/below the podium: `Favorito do público`, the competitor (photo, name, coffee shop), and a stat line `N duelos · N votos do público`. Hidden if `crowdFavorite` is null.
- **TV podium:** one tasteful line under the trophy area — `Favorito do público` + name (display font), styled like the sponsors' `Premiação patrocinada por` credit. Hidden if null.

## Acceptance criteria

- [ ] Given a duel `in_progress` with two entries, when a device POSTs `/api/duels/:id/crowd-vote` with `side: "a"`, then a `CrowdVote` row is created, `crowd_votes_a` increments by 1, and the response returns the fresh counters with `yourSide: "a"`
- [ ] Given a device already voted "a" on a duel, when it POSTs the same duel with `side: "b"`, then its `CrowdVote` row is updated (no new row), `crowd_votes_a` decrements and `crowd_votes_b` increments by 1
- [ ] Given a device already voted "a", when it POSTs "a" again, then counts are unchanged and exactly one row exists for `(duel, device)`
- [ ] Given a duel that is not `in_progress`, when any device POSTs a crowd vote, then the response is 409 with `Votação encerrada.` and no counter changes
- [ ] Given crowd votes exist on the active duel, when a client polls `current-duel`, then the `currentDuel` payload includes `crowdVotesA`, `crowdVotesB`, and `photoLeftSlot`
- [ ] Given the organizer captures a photo and taps competitor B's cup as the left cup, when they confirm, then the photo uploads with `leftSlot: "b"`, `photo_left_slot` persists as `b`, and the response returns `photoLeftSlot: "b"`
- [ ] Given a live duel with `photo_left_slot = "b"`, when the audience views the photo on the companion and TV, then the name overlays render with `[Nome B]` over the left cup and `[Nome A]` over the right cup
- [ ] Given a two-cup photo with `photo_left_slot = "b"`, when a viewer taps the **left** cup on the companion, then a crowd vote is cast for **entry B** (the left cup's competitor) — i.e. `crowd_votes_b` increments, not `crowd_votes_a`
- [ ] Given a duel with no pour photo, when the crowd-vote ballot renders, then it shows the named profile cards in entry order and a tap casts for the named competitor
- [ ] Given the organizer corrects orientation via `PATCH /api/duels/:id/photo` after the photo is live, when the surfaces next poll, then the name overlays and the left/right vote attribution swap accordingly
- [ ] Given the audience companion "Ao vivo" tab with an active duel, when the user taps a cup/card, then that side highlights immediately (optimistic), the request is sent, and the displayed tally reconciles to the server counts
- [ ] Given the user has voted, when the duel completes, then voting is disabled, `Votação encerrada.` is shown, and the final bar is frozen
- [ ] Given an event created with `crowd_vote_enabled = false`, when the audience views a live duel, then no ballot appears on the companion and no crowd-lean bar appears on the TV, while the pour photo + correct names still render
- [ ] Given an event with crowd vote disabled, when a device POSTs `/api/duels/:id/crowd-vote`, then the response is 403 `Voto do público desativado.` and no `CrowdVote` rows or counters change
- [ ] Given crowd vote is disabled for an event, when it finishes, then `crowdFavorite` is null and no Favorito do público UI appears anywhere
- [ ] Given an organizer flips crowd vote off during a running event, when the surfaces next poll, then the ballot and lean bar disappear and any previously cast votes are retained (not deleted)
- [ ] Given the default, when an organizer creates an event without touching the toggle, then `crowd_vote_enabled` is true
- [ ] Given an event finishes with crowd votes cast, when `leaderboard` is fetched, then `crowdFavorite` names the competitor with the most crowd "wins" (tiebroken by total crowd votes), and the companion + TV podium display the award
- [ ] Given an event finished with no crowd votes at all, when the finished surfaces render, then `crowdFavorite` is null and no Favorito do público UI appears
- [ ] **Integrity:** Given crowd voting happens throughout an event, when the bracket and official results are inspected, then `votes_a`/`votes_b`, winners, and advancement are byte-for-byte identical to an equivalent event with no crowd votes
- [ ] Given the TV display renders a live duel with crowd votes at 1920×1080 and 3840×2160, when the crowd-lean bar shows, then it sits secondary to the official `N × M`, scales proportionally, and disappears when crowd votes are zero — verified via Playwright `setViewportSize`
- [ ] Given a returning device (same `localStorage`), when it reopens the companion during the same duel, then its previously selected side is shown as selected

## Risks / open questions

- **Best-effort dedup.** A random `localStorage` device id resets in incognito or on clear, allowing re-votes. Acceptable because the award is explicitly unofficial. Documented, not defended against.
- **Ballot stuffing.** A script can mint device ids and inflate counts. Mitigation: optional soft per-IP rate limit on the cast route; ultimately accepted since crowd vote never affects official results. Flag for hardening only if abused in the wild.
- **Hot-row contention.** Many concurrent casts increment a single `Duel` counter row. Fine at venue scale (hundreds). If a future event is huge, switch to the live-aggregate read path (drop counters, `GROUP BY` on poll) or buffered increments — noted as the fallback to the denormalized-counter decision.
- **Update latency.** Others see your vote at the hot-poll cadence, not instantly; your own vote is optimistic so it feels live. Acceptable.
- **LGPD.** `device_id` is an opaque random value with no PII and no cross-site use; note in the production privacy pass. Decision: `localStorage` (JS-readable, needed for selected state) over a cookie.
- **Bracket regeneration** deletes/recreates duels, cascade-deleting crowd votes. Acceptable (mirrors how judge votes behave).
- **Orientation set wrong.** If the organizer mis-taps which cup is A, names and crowd attribution invert for that duel. Mitigation: explicit one-tap confirm with a sane default, plus a `Trocar lados` correction after the fact. It's organizer-owned truth — the same trust model as the rest of vote entry. Default `a` means the worst case is identical to today's behavior.
- **Photo framing.** Split left/right tap-zones assume two cups roughly side by side (the norm). Odd framing (stacked cups, one cup, three) makes the split awkward; the named-card fallback covers the no-photo case, but a weird two-cup photo would still split at the midpoint. Acceptable; revisit with `/crema-arena-design` if it bites.
- **Open:** exact copy for the "unofficial" disclaimer, the capture prompt, and the TV `PÚBLICO` label — lock during the design sub-issue with `/crema-arena-design`.

## Breakdown sketch

Suggested sub-issues (rough ordering, each ~2–6h):

1. Schema migration + Prisma types (`CrowdVote`, `Duel.crowd_votes_a/b`, `Duel.photo_left_slot`, `Event.crowd_vote_enabled` + relation)
2. Per-event toggle: `crowd_vote_enabled` on event create/edit API + `EventForm` field + live toggle in `RunningEventPanel`; thread `crowdVoteEnabled` into `current-duel`
3. Photo orientation: extend `POST /api/duels/:id/photo` with `leftSlot` + new `PATCH`; capture step in TapToTally (`Toque no copo de [Nome A]`, default left, `Trocar lados`; required only when crowd vote is on)
4. `POST /api/duels/:id/crowd-vote` (public) — upsert + transactional counter sync + `in_progress` gate + disabled-event 403; unit-test the insert/switch/no-op/closed/disabled branches
5. `lib/device-id.ts` client helper (device id + per-duel selected-side persistence)
6. Extend `current-duel` payload with `crowdVotesA/B` + `photoLeftSlot`; thread through `LiveCompanion` → `AoVivoTab`; fix photo name overlays to honor `photoLeftSlot` (companion + TV)
7. `CrowdVoteBar` component — photo-as-ballot tap-zones (+ named-card fallback), optimistic, tally, selected + closed states, gated on `crowdVoteEnabled` — design pass with `/crema-arena-design`
8. `lib/crowd-vote.ts` `computeCrowdFavorite` + extend `leaderboard` with `crowdFavorite` (null when disabled); unit-test win/tiebreak/null
9. Favorito do público on companion Leaderboard tab (finished)
10. TV crowd-lean bar near the score (gated) + podium credit line; verify at 1920×1080 and 3840×2160
11. (Bonus) Position TapToTally judge A/B buttons by `photo_left_slot`
12. Cross-surface browser verification (Playwright): toggle off → no ballot/bar but photo+names remain; set orientation → correct names + correct attribution when tapping a cup; cast → tally moves on companion + TV; finished award; **integrity check** that official results are unaffected; copy review
