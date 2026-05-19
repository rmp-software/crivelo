'use client';

import { Trophy, Circle } from 'lucide-react';
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
  status: 'pending' | 'in_progress' | 'completed' | 'walkover';
  votesA: number;
  votesB: number;
  entryA: Entry | null;
  entryB: Entry | null;
  winner: Entry | null;
}

interface EventData {
  id: string;
  name: string;
  status: string;
  bracketSize: number;
}

interface ChaveTabProps {
  event: EventData;
  duels: Duel[];
  totalRounds: number;
  currentDuel: any;
}

export default function ChaveTab({ event, duels, totalRounds, currentDuel }: ChaveTabProps) {
  // Event not started yet — bracket may already be generated, but it's not public until the event starts.
  if (event.status === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-2)] mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            O evento ainda não começou
          </h2>
          <p className="text-[var(--fg-3)] text-sm">
            A chave será exibida quando o evento começar
          </p>
        </div>
      </div>
    );
  }

  // Organize duels by round
  const duelsByRound: Duel[][] = [];
  for (let round = 1; round <= totalRounds; round++) {
    const roundDuels = duels
      .filter((d) => d.round === round)
      .sort((a, b) => a.position - b.position);
    duelsByRound.push(roundDuels);
  }

  const getRoundLabel = (roundIndex: number) => {
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semifinal';
    return `Rodada ${roundIndex + 1}`;
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[var(--fg)] font-[family-name:var(--font-display)]">
          Chave do torneio
        </h2>
        <p className="text-xs text-[var(--fg-3)] mt-1">
          Role horizontalmente para ver todas as rodadas
        </p>
      </div>

      {/* Mobile-friendly horizontal scroll bracket */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="inline-flex gap-4 pb-4">
          {duelsByRound.map((roundDuels, roundIndex) => (
            <div key={roundIndex} className="flex flex-col justify-around min-w-[280px]">
              {/* Round Header */}
              <div className="mb-3 sticky top-0 bg-[var(--bg)] py-2 z-10">
                <h3 className="font-semibold text-sm text-[var(--fg)] font-[family-name:var(--font-display)]">
                  {getRoundLabel(roundIndex)}
                </h3>
                <p className="text-xs text-[var(--fg-3)]">
                  {roundDuels.length} {roundDuels.length === 1 ? 'duelo' : 'duelos'}
                </p>
              </div>

              {/* Duels in this round */}
              <div className="flex flex-col gap-4">
                {roundDuels.map((duel) => (
                  <MobileDuelCard
                    key={duel.id}
                    duel={duel}
                    isActive={currentDuel?.id === duel.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MobileDuelCardProps {
  duel: Duel;
  isActive: boolean;
}

function MobileDuelCard({ duel, isActive }: MobileDuelCardProps) {
  const getStatusBadge = () => {
    switch (duel.status) {
      case 'completed':
        return <Badge variant="success" size="sm">Concluído</Badge>;
      case 'in_progress':
        return (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-pulse"></div>
            <Badge variant="success" size="sm">Ao vivo</Badge>
          </div>
        );
      case 'walkover':
        return <Badge variant="warning" size="sm">W.O.</Badge>;
      default:
        return <Badge variant="default" size="sm">Pendente</Badge>;
    }
  };

  const isWinner = (entry: Entry | null) => {
    if (!entry || !duel.winner) return false;
    return entry.id === duel.winner.id;
  };

  return (
    <div
      className={`bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-1)] ${
        isActive ? 'border-2 border-[var(--live)]' : 'border border-[var(--border)]'
      }`}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-[var(--bg-2)] border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--fg-3)]">Duelo {duel.position + 1}</span>
        {getStatusBadge()}
      </div>

      {/* Competitor A */}
      <CompetitorSlot
        entry={duel.entryA}
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
        entry={duel.entryB}
        votes={duel.votesB}
        isWinner={isWinner(duel.entryB)}
        showVotes={duel.status === 'in_progress' || duel.status === 'completed'}
      />
    </div>
  );
}

interface CompetitorSlotProps {
  entry: Entry | null;
  votes: number;
  isWinner: boolean;
  showVotes: boolean;
}

function CompetitorSlot({ entry, votes, isWinner, showVotes }: CompetitorSlotProps) {
  if (!entry) {
    return (
      <div className="px-3 py-3 flex items-center gap-3 bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          <Circle size={20} className="text-[var(--fg-3)]" />
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
        isWinner ? 'bg-[var(--live-soft)]' : 'bg-[var(--surface)]'
      }`}
    >
      {/* Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
        <img
          src={entry.competitor.photoUrl}
          alt={entry.competitor.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-[var(--fg)] truncate">
            {entry.competitor.name}
          </p>
          {isWinner && (
            <Trophy size={14} className="text-[var(--live)] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-[var(--fg-3)] truncate">{entry.competitor.coffeeShop}</p>
      </div>

      {/* Votes */}
      {showVotes && (
        <div className="flex-shrink-0">
          <div
            className={`px-2 py-1 rounded-[var(--radius-xs)] text-sm font-semibold font-[family-name:var(--font-mono)] ${
              isWinner
                ? 'bg-[var(--live)] text-white'
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
