# Organizer Dashboard — UI kit

Web console at 1280px max, mirroring `/dashboard/events/[id]` when an event
is running. Sources of truth:

- `app/components/Sidebar.tsx` — espresso panel, cinnamon-700 active route
- `app/components/RunningTopBar.tsx` — title + ao-vivo pill + meta
- `app/components/EventStatStrip.tsx` — 4-card grid above the running surface
- `app/components/NowPouring.tsx` — espresso hero with rings motif
- `app/components/TapToTally.tsx` — head-judge captures votes one tap at a time
- `app/components/BracketView.tsx` — column-per-round, DuelCard cells

Data here is fixture inline in `app.jsx`. In production the page polls
`/api/events/:id/current-duel` (fast) and `/bracket` (slow).
