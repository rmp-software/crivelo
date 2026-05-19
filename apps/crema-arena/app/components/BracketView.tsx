'use client';

import { Trophy, Circle } from 'lucide-react';
import Badge from './Badge';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface Duel {
  id: string;
  round: number;
  position: number;
  entryA: Competitor | null;
  entryB: Competitor | null;
  winner: Competitor | null;
  status: 'pending' | 'in_progress' | 'completed' | 'walkover';
  votesA: number;
  votesB: number;
  wildcardType?: 'walkover' | 'manual' | 'random' | null;
  isBronzeMatch?: boolean;
}

interface BracketViewProps {
  duels: Duel[];
  bracketSize: number;
}

export default function BracketView({ duels, bracketSize }: BracketViewProps) {
  // Calculate total number of rounds
  const totalRounds = Math.log2(bracketSize);

  // Organize duels by round
  const duelsByRound: Duel[][] = [];
  for (let round = 1; round <= totalRounds; round++) {
    const roundDuels = duels
      .filter((d) => d.round === round)
      .sort((a, b) => a.position - b.position);
    duelsByRound.push(roundDuels);
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-6 min-w-full pb-4">
        {duelsByRound.map((roundDuels, roundIndex) => (
          <div key={roundIndex} className="flex flex-col justify-around min-w-[280px]">
            {/* Round Header */}
            <div className="text-center mb-4 sticky top-0 bg-[var(--bg)] py-2 z-10">
              <h3 className="font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
                {roundIndex === totalRounds - 1
                  ? 'Final'
                  : roundIndex === totalRounds - 2
                  ? 'Semifinal'
                  : `Rodada ${roundIndex + 1}`}
              </h3>
              <p className="text-xs text-[var(--fg-3)]">
                {roundDuels.length} {roundDuels.length === 1 ? 'duelo' : 'duelos'}
              </p>
            </div>

            {/* Duels in this round */}
            <div className="flex flex-col gap-8 flex-1 justify-around">
              {roundDuels.map((duel) => (
                <DuelCard key={duel.id} duel={duel} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DuelCard({ duel }: { duel: Duel }) {
  const getStatusBadge = () => {
    switch (duel.status) {
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em andamento</Badge>;
      case 'walkover':
        return <Badge variant="warning">W.O.</Badge>;
      default:
        return <Badge variant="default">Pendente</Badge>;
    }
  };

  const getWildcardBadge = () => {
    if (!duel.wildcardType) return null;

    return <Badge variant="default">Wildcard</Badge>;
  };

  const isWinner = (competitor: Competitor | null) => {
    if (!competitor || !duel.winner) return false;
    return competitor.id === duel.winner.id;
  };

  const isActive = duel.status === 'in_progress';

  return (
    <div
      className={`bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)] ${
        isActive ? 'border-[var(--cinnamon-500)]' : 'border border-[var(--border)]'
      }`}
      style={isActive ? { borderWidth: '1.5px', borderStyle: 'solid' } : undefined}
    >
      {/* Status Badge */}
      <div className="px-3 py-2 bg-[var(--bg-2)] border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--fg-3)] flex items-center gap-1.5">
          {isActive && (
            <span
              className="inline-block w-2 h-2 rounded-full bg-[var(--live)]"
              aria-label="Duelo ao vivo"
            />
          )}
          {duel.isBronzeMatch ? 'Disputa de 3º lugar' : `Duelo ${duel.position + 1}`}
        </span>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {getWildcardBadge()}
        </div>
      </div>

      {/* Competitor A */}
      <CompetitorSlot
        competitor={duel.entryA}
        votes={duel.votesA}
        isWinner={isWinner(duel.entryA)}
        showVotes={duel.status === 'in_progress' || duel.status === 'completed'}
      />

      {/* VS Divider */}
      <div className="px-3 py-1 bg-[var(--bg)] text-center">
        <span className="text-xs font-semibold text-[var(--fg-3)]">VS</span>
      </div>

      {/* Competitor B */}
      <CompetitorSlot
        competitor={duel.entryB}
        votes={duel.votesB}
        isWinner={isWinner(duel.entryB)}
        showVotes={duel.status === 'in_progress' || duel.status === 'completed'}
      />
    </div>
  );
}

interface CompetitorSlotProps {
  competitor: Competitor | null;
  votes: number;
  isWinner: boolean;
  showVotes: boolean;
}

function CompetitorSlot({ competitor, votes, isWinner, showVotes }: CompetitorSlotProps) {
  if (!competitor) {
    return (
      <div className="px-3 py-3 flex items-center gap-3 bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center">
          <Circle size={20} className="text-[var(--fg-4)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--fg-3)]" aria-label="Sem oponente">—</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-3 py-3 flex items-center gap-3 ${
        isWinner ? 'bg-[var(--success-soft)] border-l-4 border-[var(--success)]' : 'bg-[var(--surface)]'
      }`}
    >
      {/* Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
        <img
          src={competitor.photoUrl}
          alt={competitor.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-[var(--fg)] truncate">
            {competitor.name}
          </p>
          {isWinner && (
            <Trophy size={14} className="text-[var(--success)] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-[var(--fg-3)] truncate">{competitor.coffeeShop}</p>
      </div>

      {/* Votes */}
      {showVotes && (
        <div className="flex-shrink-0">
          <div
            className={`px-2 py-1 rounded-[var(--radius-sm)] text-sm font-semibold ${
              isWinner
                ? 'bg-[var(--success)] text-white'
                : 'bg-[var(--bg-2)] text-[var(--fg-2)]'
            }`}
          >
            {votes}
          </div>
        </div>
      )}
    </div>
  );
}
