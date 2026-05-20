# Audience companion — UI kit

Public mobile companion for the audience, mirroring `/e/[eventId]` in
the production app (`app/components/LiveCompanion.tsx`). The QR generated
by `/api/events/:id/qr` points here.

- Sticky header with event title + status pill.
- Tab nav whose visible tabs depend on event status:
  - `setup` → [Chave]
  - `running` → [Ao vivo, Chave]
  - `finished` → [Chave, Classificação]
- Polls `/current-duel` fast (1s) and `/bracket` + `/leaderboard` slow (5s)
  in production. Here the data is static fixture in `app.jsx`.
- iPhone frame at 390×812 wraps the kit for the design-system preview.

There is no separate "organizer mobile" surface in the repo — the head
judge uses the dashboard responsively. This folder is the audience side.
