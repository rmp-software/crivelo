'use client';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface NowPouringProps {
  duelPosition: number;
  entryA: Competitor | null;
  entryB: Competitor | null;
  votesA: number;
  votesB: number;
  judgesCount: number;
}

/**
 * Espresso-background hero card for the active duel — design system's
 * NowPouring pattern adapted for our event detail screen. Shows the
 * matchup, current score, and progress dots toward judges_count.
 */
export default function NowPouring({
  duelPosition,
  entryA,
  entryB,
  votesA,
  votesB,
  judgesCount,
}: NowPouringProps) {
  const cast = votesA + votesB;

  return (
    <section
      className="relative overflow-hidden rounded-[var(--radius-lg)] mb-6"
      style={{ background: 'var(--espresso-900)', color: 'var(--crema-50)' }}
    >
      {/* Brand rings motif bleeding off the corner */}
      <img
        src="/assets/rings.svg"
        alt=""
        aria-hidden
        className="absolute -right-12 -top-12 w-64 opacity-25 pointer-events-none"
      />
      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--live)]" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--mint-100)] font-semibold">
            Duelo ao vivo · Bateria {duelPosition + 1}
          </span>
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-2xl md:text-4xl font-display font-extrabold text-[var(--crema-50)] leading-tight">
            {entryA?.name ?? 'Bye'}
          </h2>
          <span className="font-serif italic text-xl md:text-2xl text-[var(--marigold-300)]">
            vs
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-extrabold text-[var(--crema-50)] leading-tight">
            {entryB?.name ?? 'Bye'}
          </h2>
        </div>

        <p className="mt-2 text-sm text-[var(--crema-200)]">
          {entryA?.coffeeShop || '—'} · {entryB?.coffeeShop || '—'}
        </p>

        <div className="mt-5 flex items-center gap-4 flex-wrap">
          {/* Live score */}
          <div
            className="font-mono font-semibold tabular-nums leading-none text-[var(--crema-50)]"
            style={{ fontSize: 'clamp(32px, 4.5vw, 48px)' }}
            aria-label={`Placar atual: ${votesA} a ${votesB}`}
          >
            {votesA} × {votesB}
          </div>

          {/* Progress dots toward judges_count */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: judgesCount }).map((_, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i < cast ? 'var(--marigold-500)' : 'transparent',
                  border: `2px solid ${
                    i < cast ? 'var(--marigold-500)' : 'var(--espresso-500)'
                  }`,
                }}
                aria-hidden
              />
            ))}
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--crema-300)] ml-2 tabular-nums">
              {cast} / {judgesCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
