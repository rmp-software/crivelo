---
name: crema-arena-design
description: Use when designing or building any UI in the Crema Arena codebase — new screens, redesigns, copy review, brand-asset use. Applies the brand voice, design tokens, and component conventions of this specific project, grounded in the live `app/` code rather than a generic design system.
user-invocable: true
---

You are an expert designer and engineer for **Crema Arena** — a Brazilian latte-art TNT (throwdown) tournament platform. This skill bridges the brand language (cream/espresso visual world, pt-BR voice, judge-selection model) with the live codebase.

The bundle at `.design-system/crema-arena-design-system/` is *reference*. The codebase is *implementation*. Always implement against the codebase.

## Always start here

1. `/CLAUDE.md` — repo conventions, tournament lifecycle, copy rules, photo upload policy
2. `/app_spec.txt` — canonical surface spec (TV display, audience companion, organizer console)
3. `.design-system/crema-arena-design-system/README.md` — brand voice, judging model, glossary, visual foundations, iconography

## Source of truth — implementation

**Tokens.** `app/globals.css` defines every CSS variable; `tailwind.config.ts` re-exports them as Tailwind colors. Never hardcode hex — use `var(--bg)` / `bg-crema-50` / etc. If the token you need doesn't exist, add it to `globals.css` *and* `tailwind.config.ts` together.

**Fonts.** Loaded via `next/font/local` in `app/layout.tsx` from `public/fonts/`. The four CSS variables are the only way to reference them:
- `--font-display` → Bricolage Grotesque (titles)
- `--font-serif` → Instrument Serif italic (wordmark, pull quotes)
- `--font-body` → Geist (UI body)
- `--font-mono` → Geist Mono (scores, timers, seeds — always tabular figures)

Do not reintroduce `@font-face` rules or `next/font/google` for these families.

**Components.** `app/components/` is the real React production code. Look here first; only build a new component when no primitive fits.

- Primitives: `Badge`, `Button`, `Card`, `Input`, `Modal`, `ConfirmationModal`, `EmptyState`, `LoadingSpinner`, `SkeletonLoader`, `PageHeader`, `Toast`, `Wordmark`, `DateTime24h`
- Forms: `CompetitorForm`, `EventForm`, `OrganizerForm`, `SeedInput`, `WildcardModal`
- Surfaces: `LiveDisplay`, `LiveCompanion`, `NowPouring`, `RunningEventPanel`, `RunningTopBar`, `Sidebar`, `TapToTally`
- Brackets / stats: `BracketView`, `EventStatStrip`, `CompetitorPoolList`
- Tab content: `app/components/tabs/`

**Brand assets.** `public/assets/` already ships the brand SVGs: `wordmark.svg`, `monogram.svg`, `stamp-seal.svg`, `rings.svg`, `trophy.svg`. Reference them as `/assets/<name>.svg`. (Note: CLAUDE.md still says these are missing — that line is outdated.)

**Spec strings.** All user-facing pt-BR copy lives in `/app_spec.txt` under `<ui_copy_examples>` — `Voto registrado. X de Y votos.`, `[Nome] entra como wildcard.`, `Aguardando próximo duelo...`, etc. Use the exact strings — they're vetted.

**Feedback UI.** Never use native `alert()` / `confirm()`. Use `useToast()` from `app/components/Toast.tsx` for transient feedback and `ConfirmationModal` for destructive confirmations. The toast container is portal-mounted by `ToastProvider` in the root layout.

## Source of truth — visual reference

When you need to *see* how something should look (not how it's coded), use the bundle:

- `.design-system/crema-arena-design-system/preview/*.html` — standalone visual previews of brand components (buttons, cards, chips, bracket, judging, podium, sidebar, now-pouring, feedback, stats, inputs, color/type ramps)
- `.design-system/crema-arena-design-system/ui_kits/`
  - `live_display/` — design intent for `/live/[eventId]` (TV / 1920×1080)
  - `organizer_dashboard/` — design intent for `/dashboard/*` (admin console)
  - `audience_companion/` — design intent for `/e/[eventId]` (mobile audience)
- `.design-system/crema-arena-design-system/assets/` — vector source for brand SVGs (same files as `public/assets/`)

These are HTML/JSX prototypes, not implementation. Don't import them. Use them to make pixel-level decisions, then build for real in `app/`.

## Modelo de julgamento (CRITICAL)

**Seleção por jurado, não nota 0–100.** N jurados (default 3) tapam um lado cada. Placar final lê `2 × 1` ou `3 × 0`. Nunca slider, nunca breakdown por critério, nunca média numérica. The `Encerrar duelo` button stays disabled until `votesA + votesB === event.judges_count`.

## Voice cheat sheet

- pt-BR primário · address as *você* sempre (nunca *tu* nem *o senhor*)
- **Sentence case** everywhere — buttons, titles, modals. Only `TNT` stays ALL CAPS (it's a sigla).
- Imperativos curtos · um "!" por tela · sem ponto em botão · sem emoji no chrome
- Placar: `N × M` (× is U+00D7 with spaces) — never `x`
- Pluralização: `1 voto` / `N votos`, `1 vitória` / `N vitórias`
- Datas: `Sex 25 mai · 19h` (short) or `25 de maio de 2026` (long); always day-before-month

## Tokens at a glance (read `app/globals.css` for the full set)

```
--brand:  #C45A2C  (cinnamon)        --bg:    #FBF6EA  (crema)
--gold:   #E6A636  (marigold, wins)  --bg-2:  #F5ECD8
--live:   #4F8C72  (mint)            --fg:    #1F1410  (espresso)
--danger: #B83A2E  (cherry)          --fg-3:  #7A5A4A  (muted ink)

font-display: 'Bricolage Grotesque'  font-serif: 'Instrument Serif' (italic)
font-body:    'Geist'                font-mono:  'Geist Mono'
radii: 6 · 10 · 18 · 28 · 999
```

## Workflow for a UI task

1. Skim `app_spec.txt` for the affected surface (TV / audience / organizer).
2. Read existing components in `app/components/` that map to the work — match their patterns and prop shapes.
3. Read the brand `README.md` if anything about voice / palette / motif feels unclear.
4. For something visually novel, check `preview/` or `ui_kits/` to see how the bundle imagines it before writing code.
5. Build it for real in `app/` using tokens + existing primitives. Add new components only when no primitive fits.
6. Run `npx tsc --noEmit` before declaring done — the de-facto pre-commit gate.
7. For UI changes, run the dev server (`npm run dev` on `:3000`) and verify in a browser before claiming the work is complete.

## Refreshing the design system

When the bundle is stale, use the sibling **`design-system-sync`** skill to fetch / clean / remove it. Do not edit the bundle by hand — your edits will be lost on the next refresh.
