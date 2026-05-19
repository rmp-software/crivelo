'use client';

interface Competitor {
  id: string;
  name: string;
  photo_url: string;
  coffee_shop: string;
}

interface LiveCompetitorCardProps {
  competitor: Competitor;
  score: number | null;
  side: 'A' | 'B';
  isActive: boolean;
}

export default function LiveCompetitorCard({
  competitor,
  score,
  side,
  isActive,
}: LiveCompetitorCardProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-6 p-8
        rounded-[var(--radius-lg)]
        bg-[var(--surface-raised)]
        border-2 transition-all duration-300
        ${isActive
          ? 'border-[var(--brand)] shadow-2xl scale-105'
          : 'border-[var(--border-strong)]'
        }
        min-w-[300px] max-w-[600px] w-full
      `}
    >
      {/* Competitor Photo */}
      <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[var(--espresso-500)] shadow-lg">
        <img
          src={competitor.photo_url}
          alt={competitor.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Competitor Name */}
      <h2 className="text-4xl font-display font-bold text-center text-[var(--fg)] leading-tight">
        {competitor.name}
      </h2>

      {/* Coffee Shop */}
      <p className="text-2xl font-serif italic text-[var(--fg-2)] text-center">
        {competitor.coffee_shop}
      </p>

      {/* Score (if running) */}
      {score !== null && (
        <div className="flex items-center justify-center">
          <div className="px-8 py-4 bg-[var(--espresso-900)] rounded-[var(--radius-md)]">
            <span className="text-5xl font-display font-bold text-[var(--fg-inverse)] tabular-nums">
              {score}
            </span>
          </div>
        </div>
      )}

      {/* Side Indicator */}
      <div
        className={`
          px-6 py-2 rounded-full text-sm font-display font-semibold uppercase tracking-wider
          ${side === 'A'
            ? 'bg-[var(--marigold-100)] text-[var(--espresso-900)]'
            : 'bg-[var(--mint-100)] text-[var(--espresso-900)]'
          }
        `}
      >
        {side === 'A' ? 'Competitor A' : 'Competitor B'}
      </div>
    </div>
  );
}
