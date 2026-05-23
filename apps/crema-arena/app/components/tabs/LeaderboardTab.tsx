'use client';

import { Trophy, Medal } from 'lucide-react';
import Badge from '../Badge';
import type { CrowdFavorite } from '@/lib/crowd-vote';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface LeaderboardEntry {
  position: number;
  entryId: string;
  competitor: Competitor;
  status: 'active' | 'eliminated' | 'wildcard_in' | 'dropped_out';
  wins: number;
  totalVotesReceived: number;
  eliminatedAtRound: number | null;
  seed: number | null;
}

interface EventData {
  id: string;
  name: string;
  status: string;
}

interface LeaderboardTabProps {
  event: EventData;
  leaderboard: LeaderboardEntry[];
  isComplete: boolean;
  crowdFavorite?: CrowdFavorite | null;
}

export default function LeaderboardTab({
  event,
  leaderboard,
  isComplete,
  crowdFavorite = null,
}: LeaderboardTabProps) {
  // Event not started yet
  if (event.status === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-2)] mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            Classificação indisponível
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            A classificação será exibida quando o evento começar
          </p>
        </div>
      </div>
    );
  }

  // No standings yet
  if (leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)] mb-4"></div>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-2">
            Aguardando resultados...
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            A classificação será atualizada após os primeiros duelos
          </p>
        </div>
      </div>
    );
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--gold-soft)] text-[var(--gold)]">
          <Trophy size={14} className="flex-shrink-0" />
          <span className="text-xs font-semibold font-[family-name:var(--font-mono)]">1º</span>
        </div>
      );
    }
    if (position === 2) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--bg-3)] text-[var(--fg-2)]">
          <Medal size={14} className="flex-shrink-0" />
          <span className="text-xs font-semibold font-[family-name:var(--font-mono)]">2º</span>
        </div>
      );
    }
    if (position === 3) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--bg-3)] text-[var(--fg-2)]">
          <Medal size={14} className="flex-shrink-0" />
          <span className="text-xs font-semibold font-[family-name:var(--font-mono)]">3º</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--fg-2)] font-[family-name:var(--font-mono)]">
          {position}
        </span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Ativo</Badge>;
      case 'wildcard_in':
        return <Badge variant="warning" size="sm">Wildcard</Badge>;
      case 'eliminated':
        return <Badge variant="default" size="sm">Eliminado</Badge>;
      case 'dropped_out':
        return <Badge variant="danger" size="sm">Desistente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[var(--fg)] font-[family-name:var(--font-display)]">
          {isComplete ? 'Classificação final' : 'Classificação parcial'}
        </h2>
        <p className="text-xs text-[var(--fg-3)] mt-1">
          {isComplete
            ? 'Resultado final do torneio'
            : 'Atualizando a cada 5 segundos'}
        </p>
      </div>

      {/* Favorito do público — finished-state award, separate from the champion.
          Hidden entirely when crowdFavorite is null (disabled, no votes, or not
          finished — the leaderboard API only returns it when applicable). The
          isComplete gate mirrors the Champion banner so the component is
          self-contained (defense-in-depth against a non-finished API payload). */}
      {isComplete && crowdFavorite && (
        <div className="mb-4 bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)] border-2 border-[var(--gold)]">
          <div className="px-4 pt-3 pb-2 bg-[var(--gold-soft)] border-b border-[var(--gold)]">
            <p className="text-xs font-bold text-[var(--gold)] uppercase tracking-wide font-[family-name:var(--font-mono)]">
              Favorito do público
            </p>
          </div>
          <div className="p-4 flex items-center gap-3">
            {/* Photo — matches the standings-row avatar treatment */}
            <div className="rounded-full overflow-hidden bg-[var(--bg-2)] flex-shrink-0 w-14 h-14 border-2 border-[var(--gold)]">
              <img
                src={crowdFavorite.competitor.photoUrl}
                alt={crowdFavorite.competitor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-base text-[var(--gold)]">
                {crowdFavorite.competitor.name}
              </p>
              <p className="text-xs text-[var(--fg-3)] truncate">
                {crowdFavorite.competitor.coffeeShop}
              </p>
              <p className="text-xs text-[var(--fg-2)] mt-1 font-[family-name:var(--font-mono)]">
                {crowdFavorite.crowdWins === 1
                  ? '1 duelo'
                  : `${crowdFavorite.crowdWins} duelos`}
                {' · '}
                {crowdFavorite.crowdVotes === 1
                  ? '1 voto do público'
                  : `${crowdFavorite.crowdVotes} votos do público`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isTopThree = entry.position <= 3;
          const isFirst = entry.position === 1;

          return (
            <div
              key={entry.entryId}
              className={`bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)] border ${
                isFirst
                  ? 'border-2 border-[var(--gold)]'
                  : 'border border-[var(--border)]'
              }`}
            >
              <div className="p-4 flex items-center gap-3">
                {/* Position */}
                <div className="flex-shrink-0">
                  {getPositionBadge(entry.position)}
                </div>

                {/* Photo */}
                <div
                  className={`rounded-full overflow-hidden bg-[var(--bg-2)] flex-shrink-0 ${
                    isFirst ? 'w-14 h-14 border-2 border-[var(--gold)]' : 'w-12 h-12 border-2 border-[var(--border)]'
                  }`}
                >
                  <img
                    src={entry.competitor.photoUrl}
                    alt={entry.competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info — position + name + cafeteria only (wildcards make wins/votes confusing) */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold truncate ${
                      isFirst ? 'text-base text-[var(--gold)]' : 'text-sm text-[var(--fg)]'
                    }`}
                  >
                    {entry.competitor.name}
                  </p>
                  <p className="text-xs text-[var(--fg-3)] truncate">
                    {entry.competitor.coffeeShop}
                  </p>
                </div>
              </div>

              {/* Champion Banner */}
              {isFirst && isComplete && (
                <div className="px-4 py-2 bg-[var(--gold-soft)] border-t border-[var(--gold)] text-center">
                  <p className="text-xs font-bold text-[var(--gold)] uppercase tracking-wide">
                    🏆 Campeão
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {!isComplete && (
        <div className="mt-6 p-4 bg-[var(--bg-2)] rounded-[var(--radius-md)] border border-[var(--border)]">
          <p className="text-xs text-[var(--fg-3)] text-center">
            Classificação parcial • Será atualizada conforme os duelos avançarem
          </p>
        </div>
      )}
    </div>
  );
}
