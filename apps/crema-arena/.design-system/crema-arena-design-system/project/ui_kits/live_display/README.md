# Live Display — UI kit

1920×1080 stage at `/live/[eventId]`. Mirrors `app/components/LiveDisplay.tsx`.

- Espresso background, no glow, no gradients.
- Header: `AO VIVO` pill (left), event title + round label (centre), duel
  timer in mono (right).
- Centerpiece: two `CompetitorBlock`s flanking a central `N × M` mono score.
  When the head judge uploads a pour photo, `PourPhotoCenterpiece` replaces
  the profile cards.
- Mini-bracket strip below the centerpiece shows the other duels of the
  current round.
- QR badge anchored to the bottom-right; it links to `/e/[eventId]` so the
  audience can follow on their phone.

The host page (`index.html`) scales the 1920×1080 stage to fit any viewport,
preserving aspect ratio. The fake duel timer counts up so the mono display
ticks live in the preview.
