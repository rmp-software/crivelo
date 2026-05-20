'use client';

import Badge from '../Badge';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface Entry {
  id: string;
  competitor: Competitor;
}

interface Duel {
  id: string;
  round: number;
  position: number;
  status: string;
  votesA: number;
  votesB: number;
  pourPhotoUrl?: string | null;
  entryA: Entry | null;
  entryB: Entry | null;
  winner?: Entry | null;
  isBronzeMatch?: boolean;
}

interface EventData {
  id: string;
  name: string;
  status: 'setup' | 'running' | 'finished';
  judgesCount: number;
}

interface AoVivoTabProps {
  event: EventData;
  currentDuel: Duel | null;
  nextDuel: Duel | null;
  currentRound: number;
  totalRounds: number;
  roundDuels?: Duel[];
}

export default function AoVivoTab({
  event,
  currentDuel,
  nextDuel,
  currentRound,
  totalRounds,
  roundDuels = [],
}: AoVivoTabProps) {
  // Event not started yet
  if (event.status === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-2)] mb-4">
            <span className="text-3xl">⏱️</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            O evento ainda não começou
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            Aguarde o início das competições
          </p>
        </div>
      </div>
    );
  }

  // Event finished
  if (event.status === 'finished') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--gold-soft)] mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            Evento encerrado
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            Confira o leaderboard para ver os resultados finais
          </p>
        </div>
      </div>
    );
  }

  // No active duel
  if (!currentDuel && !nextDuel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)] mb-4"></div>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-2">
            Aguardando próximo duelo...
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            Os organizadores estão preparando a próxima rodada
          </p>
        </div>
      </div>
    );
  }

  const getRoundLabel = (round: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    return `Rodada ${round}`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Current Duel */}
      {currentDuel && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse"></div>
              <span className="text-xs font-semibold text-[var(--live)] uppercase tracking-wide font-[family-name:var(--font-mono)]">
                AO VIVO
              </span>
            </div>
            <span className="text-xs text-[var(--fg-3)]">•</span>
            <span className="text-xs text-[var(--fg-3)]">
              {getRoundLabel(currentDuel.round)} · Duelo {currentDuel.position + 1}
            </span>
          </div>

          <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-2)] border-2 border-[var(--live)]">
            {/* Pour Photo or Competitor Cards */}
            {currentDuel.pourPhotoUrl ? (
              <div className="relative">
                <img
                  src={currentDuel.pourPhotoUrl}
                  alt="Duelo"
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex justify-between items-end text-white">
                    {currentDuel.entryA && (
                      <div className="flex-1">
                        <p className="font-semibold text-sm truncate">{currentDuel.entryA.competitor.name}</p>
                        <p className="text-xs opacity-90 truncate">{currentDuel.entryA.competitor.coffeeShop}</p>
                      </div>
                    )}
                    <div className="px-3">
                      <span className="text-xs opacity-75">VS</span>
                    </div>
                    {currentDuel.entryB && (
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-sm truncate">{currentDuel.entryB.competitor.name}</p>
                        <p className="text-xs opacity-90 truncate">{currentDuel.entryB.competitor.coffeeShop}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
                {/* Competitor A */}
                {currentDuel.entryA && (
                  <div className="bg-[var(--surface)] p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] mb-3">
                        <img
                          src={currentDuel.entryA.competitor.photoUrl}
                          alt={currentDuel.entryA.competitor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-semibold text-sm text-[var(--fg)] mb-1 line-clamp-2">
                        {currentDuel.entryA.competitor.name}
                      </p>
                      <p className="text-xs text-[var(--fg-3)] line-clamp-1">
                        {currentDuel.entryA.competitor.coffeeShop}
                      </p>
                    </div>
                  </div>
                )}

                {/* Competitor B */}
                {currentDuel.entryB && (
                  <div className="bg-[var(--surface)] p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] mb-3">
                        <img
                          src={currentDuel.entryB.competitor.photoUrl}
                          alt={currentDuel.entryB.competitor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-semibold text-sm text-[var(--fg)] mb-1 line-clamp-2">
                        {currentDuel.entryB.competitor.name}
                      </p>
                      <p className="text-xs text-[var(--fg-3)] line-clamp-1">
                        {currentDuel.entryB.competitor.coffeeShop}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Score */}
            <div className="p-4 bg-[var(--bg-2)] border-t border-[var(--border)]">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--border)]">
                    <span className="text-2xl font-bold text-[var(--fg)] font-[family-name:var(--font-mono)]">
                      {currentDuel.votesA}
                    </span>
                  </div>
                  <span className="text-[var(--fg-3)] text-lg font-[family-name:var(--font-mono)]">×</span>
                  <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--border)]">
                    <span className="text-2xl font-bold text-[var(--fg)] font-[family-name:var(--font-mono)]">
                      {currentDuel.votesB}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-[var(--fg-3)] mt-2">
                {currentDuel.votesA + currentDuel.votesB} de {event.judgesCount} votos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Duel — surfaced ABOVE the round list so the audience always
          sees the upcoming matchup at the top of the tab. */}
      {!currentDuel && nextDuel && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--fg-2)] mb-3">Próximo duelo</h3>
          <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)] border border-[var(--border)]">
            <div className="p-3 bg-[var(--bg-2)] border-b border-[var(--border)]">
              <p className="text-xs text-[var(--fg-3)]">
                {getRoundLabel(nextDuel.round)} · Duelo {nextDuel.position + 1}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
              {nextDuel.entryA && (
                <div className="bg-[var(--surface)] p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                      <img
                        src={nextDuel.entryA.competitor.photoUrl}
                        alt={nextDuel.entryA.competitor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[var(--fg)] truncate">
                        {nextDuel.entryA.competitor.name}
                      </p>
                      <p className="text-xs text-[var(--fg-3)] truncate">
                        {nextDuel.entryA.competitor.coffeeShop}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {nextDuel.entryB && (
                <div className="bg-[var(--surface)] p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                      <img
                        src={nextDuel.entryB.competitor.photoUrl}
                        alt={nextDuel.entryB.competitor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[var(--fg)] truncate">
                        {nextDuel.entryB.competitor.name}
                      </p>
                      <p className="text-xs text-[var(--fg-3)] truncate">
                        {nextDuel.entryB.competitor.coffeeShop}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact history: other duels in the current round — excludes walkovers
          (only shows real head-to-head duels with both slots filled). */}
      {(() => {
        const others = roundDuels.filter(
          (d) => (!currentDuel || d.id !== currentDuel.id) && !!d.entryA && !!d.entryB
        );
        const completed = others
          .filter((d) => d.status === 'completed')
          .sort((a, b) => b.position - a.position); // newest first by position desc
        const pending = others.filter((d) => d.status === 'pending' || d.status === 'in_progress');
        if (completed.length === 0 && pending.length === 0) return null;
        return (
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-2)] mb-3">
              Duelos da rodada
            </h3>
            <div className="space-y-2">
              {completed.map((d) => (
                <CompactDuelRow key={d.id} duel={d} state="completed" />
              ))}
              {pending.map((d) => (
                <CompactDuelRow key={d.id} duel={d} state="pending" />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CompactDuelRow({ duel, state }: { duel: Duel; state: 'completed' | 'pending' }) {
  const winnerId = duel.winner?.id ?? null;
  const isWalkover = duel.status === 'walkover';
  const subtitle = duel.isBronzeMatch
    ? 'Disputa de 3º lugar'
    : `Duelo ${duel.position + 1}`;
  return (
    <div
      className={`rounded-[var(--radius-sm)] border p-3 ${
        state === 'completed'
          ? 'border-[var(--border)] bg-[var(--surface)]'
          : 'border-[var(--border)] bg-[var(--bg-2)] opacity-80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
          {subtitle} · {state === 'completed' ? (isWalkover ? 'W.O.' : 'Concluído') : 'Pendente'}
        </span>
        {state === 'completed' && (
          <span className="font-mono text-sm font-semibold tabular-nums text-[var(--fg)]">
            {duel.votesA} × {duel.votesB}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CompactCompetitor entry={duel.entryA} isWinner={winnerId === duel.entryA?.id && state === 'completed'} />
        <CompactCompetitor entry={duel.entryB} isWinner={winnerId === duel.entryB?.id && state === 'completed'} />
      </div>
    </div>
  );
}

function CompactCompetitor({ entry, isWinner }: { entry: Entry | null; isWinner: boolean }) {
  if (!entry) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--fg-3)]" aria-label="Sem oponente">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-2)] border border-[var(--border)]" />
        —
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-2 ${
        isWinner ? 'font-semibold' : ''
      }`}
    >
      <img
        src={entry.competitor.photoUrl}
        alt={entry.competitor.name}
        className={`w-8 h-8 rounded-full object-cover border ${
          isWinner ? 'border-[var(--gold)]' : 'border-[var(--border)]'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--fg)] truncate leading-tight">{entry.competitor.name}</p>
        <p className="text-[10px] text-[var(--fg-3)] truncate leading-tight">{entry.competitor.coffeeShop}</p>
      </div>
    </div>
  );
}
