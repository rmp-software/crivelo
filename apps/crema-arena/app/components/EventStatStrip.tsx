'use client';

interface Duel {
  id: string;
  round: number;
  status: string;
  votesA: number;
  votesB: number;
}

interface StatStripProps {
  totalEntries: number;
  duels: Duel[];
  currentRound: number | null;
  judgesCount: number;
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 md:p-5 shadow-[var(--shadow-1)]">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-3)]">
        {label}
      </div>
      <div className="font-mono text-3xl md:text-4xl font-semibold tabular-nums text-[var(--fg)] leading-none mt-1">
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: accent ?? 'var(--fg-3)' }}>
        {sub}
      </div>
    </div>
  );
}

export default function EventStatStrip({
  totalEntries,
  duels,
  currentRound,
  judgesCount,
}: StatStripProps) {
  // Baterias = duels in the *current* round
  const currentDuels = currentRound
    ? duels.filter((d) => d.round === currentRound)
    : [];
  const completedCurrent = currentDuels.filter(
    (d) => d.status === 'completed' || d.status === 'walkover'
  ).length;
  const pct = currentDuels.length
    ? Math.round((completedCurrent / currentDuels.length) * 100)
    : 0;

  // Unânimes: completed duels where one side has 0 votes and the other has all
  const unanimous = duels.filter((d) => {
    if (d.status !== 'completed') return false;
    const total = d.votesA + d.votesB;
    return total > 0 && (d.votesA === 0 || d.votesB === 0) && total === judgesCount;
  }).length;

  // Próxima: next pending duel — "Pronto" if any, "—" if none
  const nextPending = duels.find(
    (d) => d.status === 'pending' || d.status === 'in_progress'
  );

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <StatCard
        label="Na chave"
        value={String(totalEntries)}
        sub={`${totalEntries} ${totalEntries === 1 ? 'confirmado' : 'confirmados'}`}
      />
      <StatCard
        label="Baterias"
        value={`${completedCurrent} / ${currentDuels.length}`}
        sub={
          currentRound
            ? `Rodada ${currentRound} · ${pct}% concluída`
            : 'Aguardando'
        }
        accent="var(--cinnamon-600)"
      />
      <StatCard
        label="Unânimes"
        value={String(unanimous)}
        sub={`${unanimous === 1 ? 'duelo' : 'duelos'} ${judgesCount} × 0`}
      />
      <StatCard
        label="Próxima"
        value={nextPending ? 'Pronto' : '—'}
        sub={nextPending ? `Bateria ${nextPending.round}.${duels.indexOf(nextPending) + 1}` : 'Sem duelos pendentes'}
        accent={nextPending ? 'var(--mint-700)' : undefined}
      />
    </section>
  );
}
